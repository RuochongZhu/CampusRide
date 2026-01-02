-- CampusRide Database Schema
-- This schema supports both Cursor AI and Claude Code modules

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- CORE TABLES (Shared by both modules)
-- ================================================================

-- Users table (Enhanced by Cursor AI, used by Claude Code)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@cornell.edu'),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL DEFAULT 'User',
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  university VARCHAR(100) NOT NULL DEFAULT 'Cornell University',
  major VARCHAR(100),
  graduation_year INTEGER,
  bio TEXT,
  points INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  email_verified_at TIMESTAMP,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  last_login_date TIMESTAMP,
  consecutive_login_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- ================================================================
-- NOTIFICATIONS SYSTEM (Claude Code module)
-- ================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  channels TEXT[] DEFAULT ARRAY['socket', 'database'],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- ================================================================
-- POINTS SYSTEM (Claude Code module)
-- ================================================================

-- Point transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'deducted', 'bonus', 'penalty', 'transfer_in', 'transfer_out')),
  points INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  rule_type VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  multiplier INTEGER DEFAULT 1,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for point_transactions
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_source ON point_transactions(source);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_rule_type ON point_transactions(rule_type);

-- ================================================================
-- ACTIVITIES SYSTEM (Claude Code module)
-- ================================================================

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'team', 'competition', 'workshop', 'seminar')),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location VARCHAR(255),
  location_coordinates JSONB, -- {lat: number, lng: number}
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  entry_fee_points INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  requirements TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  contact_info JSONB DEFAULT '{}',
  checkin_code VARCHAR(10),
  location_verification BOOLEAN DEFAULT false,
  auto_complete BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_organizer_id ON activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_registration_deadline ON activities(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location);
CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON activities(featured);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Full text search index for activities
CREATE INDEX IF NOT EXISTS idx_activities_search ON activities USING GIN(to_tsvector('english', title || ' ' || description));

-- Activity participations table
CREATE TABLE IF NOT EXISTS activity_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent', 'cancelled')),
  checkin_time TIMESTAMP,
  checkin_location JSONB, -- {lat: number, lng: number}
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  points_earned INTEGER DEFAULT 0,
  certificate_url TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(activity_id, user_id)
);

-- Create indexes for activity_participations
CREATE INDEX IF NOT EXISTS idx_activity_participations_activity_id ON activity_participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participations_user_id ON activity_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participations_attendance ON activity_participations(attendance_status);
CREATE INDEX IF NOT EXISTS idx_activity_participations_registration ON activity_participations(registration_time DESC);

-- ================================================================
-- LEADERBOARD SYSTEM (Claude Code module)
-- ================================================================

-- Leaderboard entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('overall', 'academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology')),
  points INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  activities_count INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'semester', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, category, period_type, period_start, period_end)
);

-- Create indexes for leaderboard_entries
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category_period ON leaderboard_entries(category, period_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard_entries(points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_dates ON leaderboard_entries(period_start, period_end);

-- ================================================================
-- RIDESHARE SYSTEM (Cursor AI module)
-- ================================================================

-- Rideshare rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  departure_location VARCHAR(255) NOT NULL,
  departure_coordinates JSONB, -- {lat: number, lng: number, address: string}
  destination_location VARCHAR(255) NOT NULL,
  destination_coordinates JSONB, -- {lat: number, lng: number, address: string}
  departure_time TIMESTAMP NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
  vehicle_info JSONB DEFAULT '{}', -- {make, model, color, license_plate}
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  preferences JSONB DEFAULT '{}', -- {smoking, pets, music, etc}
  contact_info JSONB DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern JSONB DEFAULT '{}', -- {days_of_week, end_date}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rides
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_departure_location ON rides(departure_location);
CREATE INDEX IF NOT EXISTS idx_rides_destination_location ON rides(destination_location);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);

-- Rideshare bookings table
CREATE TABLE IF NOT EXISTS ride_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  pickup_location VARCHAR(255),
  pickup_coordinates JSONB,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ride_id, passenger_id)
);

-- Create indexes for ride_bookings
CREATE INDEX IF NOT EXISTS idx_ride_bookings_ride_id ON ride_bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger_id ON ride_bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_status ON ride_bookings(status);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_created_at ON ride_bookings(created_at DESC);

-- ================================================================
-- MARKETPLACE SYSTEM (Cursor AI module)
-- ================================================================

-- Marketplace items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  location VARCHAR(255),
  location_coordinates JSONB,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'removed')),
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_negotiable BOOLEAN DEFAULT true,
  contact_preference VARCHAR(20) DEFAULT 'app' CHECK (contact_preference IN ('app', 'phone', 'email')),
  delivery_options TEXT[] DEFAULT ARRAY['pickup'],
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for marketplace_items
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON marketplace_items(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_created_at ON marketplace_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_featured ON marketplace_items(featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_tags ON marketplace_items USING GIN(tags);

-- Full text search index for marketplace items
CREATE INDEX IF NOT EXISTS idx_marketplace_search ON marketplace_items USING GIN(to_tsvector('english', title || ' ' || description));

-- Marketplace favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, item_id)
);

-- Create indexes for marketplace_favorites
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user_id ON marketplace_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_item_id ON marketplace_favorites(item_id);

-- ================================================================
-- SOCKET CONNECTIONS (For real-time features)
-- ================================================================

-- Socket connections tracking table
CREATE TABLE IF NOT EXISTS socket_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) NOT NULL,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for socket_connections
CREATE INDEX IF NOT EXISTS idx_socket_connections_user_id ON socket_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_socket_connections_socket_id ON socket_connections(socket_id);
CREATE INDEX IF NOT EXISTS idx_socket_connections_active ON socket_connections(is_active);

-- ================================================================
-- DATABASE FUNCTIONS
-- ================================================================

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE users 
  SET points = points + points_to_add,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id;
  
  SELECT points INTO new_points FROM users WHERE id = user_id;
  RETURN new_points;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer points between users
CREATE OR REPLACE FUNCTION transfer_points(from_user_id UUID, to_user_id UUID, points_amount INTEGER, transfer_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  from_user_points INTEGER;
  to_user_points INTEGER;
  transaction_id UUID;
BEGIN
  -- Check if sender has enough points
  SELECT points INTO from_user_points FROM users WHERE id = from_user_id;
  
  IF from_user_points < points_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'available', from_user_points,
      'required', points_amount
    );
  END IF;
  
  -- Perform transfer
  UPDATE users SET points = points - points_amount WHERE id = from_user_id;
  UPDATE users SET points = points + points_amount WHERE id = to_user_id;
  
  -- Record transactions
  transaction_id := uuid_generate_v4();
  
  INSERT INTO point_transactions (id, user_id, transaction_type, points, source, reason, to_user_id, from_user_id)
  VALUES (transaction_id, from_user_id, 'transfer_out', -points_amount, 'transfer', transfer_reason, to_user_id, from_user_id);
  
  INSERT INTO point_transactions (id, user_id, transaction_type, points, source, reason, to_user_id, from_user_id)
  VALUES (uuid_generate_v4(), to_user_id, 'transfer_in', points_amount, 'transfer', transfer_reason, to_user_id, from_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'transferred_amount', points_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update activity participant count
CREATE OR REPLACE FUNCTION update_activity_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities 
    SET current_participants = current_participants + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.activity_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities 
    SET current_participants = current_participants - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.activity_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for activity participant count
CREATE TRIGGER trigger_update_activity_participant_count
  AFTER INSERT OR DELETE ON activity_participations
  FOR EACH ROW EXECUTE FUNCTION update_activity_participant_count();

-- Function to update marketplace favorite count
CREATE OR REPLACE FUNCTION update_marketplace_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_items 
    SET favorite_count = favorite_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_items 
    SET favorite_count = favorite_count - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for marketplace favorite count
CREATE TRIGGER trigger_update_marketplace_favorite_count
  AFTER INSERT OR DELETE ON marketplace_favorites
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_favorite_count();

-- ================================================================
-- INITIAL DATA SETUP
-- ================================================================

-- Create default admin user (password: admin1234 - 8 chars alphanumeric)
INSERT INTO users (
  id, student_id, email, password_hash, first_name, last_name, 
  university, role, verification_status, points
) VALUES (
  uuid_generate_v4(),
  'admin',
  'admin@cornell.edu',
  '$2a$12$LQv3c1yqBw2gPvKqP7m.AOHQr3f9KqWf7JFj4JQY9t8ZjlGQx1p3m', -- admin123 (needs to be changed to admin1234)
  'System',
  'Administrator',
  'Cornell University',
  'admin',
  'verified',
  1000
) ON CONFLICT (email) DO NOTHING;

-- Create sample categories for activities
INSERT INTO activities (
  id, title, description, category, type, organizer_id, 
  location, start_time, end_time, max_participants, reward_points, status
) VALUES (
  uuid_generate_v4(),
  '欢迎使用 CampusRide',
  '这是一个示例活动，展示平台功能',
  'social',
  'seminar',
  (SELECT id FROM users WHERE email = 'admin@campusride.edu'),
  '学生活动中心',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP + INTERVAL '7 days 2 hours',
  100,
  20,
  'published'
) ON CONFLICT DO NOTHING;

-- Create sample notification templates
INSERT INTO notifications (
  id, user_id, type, title, content, priority
) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM users WHERE email = 'admin@campusride.edu'),
  'system_announcement',
  '欢迎使用 CampusRide 系统',
  '欢迎使用 CampusRide! 这是一个为大学生打造的综合服务平台。',
  'high'
) ON CONFLICT DO NOTHING;