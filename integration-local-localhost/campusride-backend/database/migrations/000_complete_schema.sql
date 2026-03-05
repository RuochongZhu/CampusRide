-- =============================================
-- CampusRide Complete Database Schema
-- Run this on a clean Supabase database
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. USERS TABLE (Core)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nickname VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    university VARCHAR(255),
    major VARCHAR(255),
    graduation_year INTEGER,
    bio TEXT,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    is_visible BOOLEAN DEFAULT TRUE,
    current_location JSONB,
    last_location_update TIMESTAMPTZ,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    driver_rating DECIMAL(3,2) DEFAULT 0,
    driver_rating_count INTEGER DEFAULT 0,
    passenger_rating DECIMAL(3,2) DEFAULT 0,
    passenger_rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. GROUPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_count INTEGER DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. GROUP MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- =============================================
-- 4. ACTIVITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location TEXT,
    location_coordinates JSONB,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    reward_points INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'published',
    checkin_enabled BOOLEAN DEFAULT TRUE,
    checkin_code VARCHAR(20),
    code_expires_at TIMESTAMPTZ,
    location_verification BOOLEAN DEFAULT FALSE,
    max_checkin_distance INTEGER DEFAULT 100,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. ACTIVITY PARTICIPANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_time TIMESTAMPTZ DEFAULT NOW(),
    attendance_status VARCHAR(50) DEFAULT 'registered',
    checkin_time TIMESTAMPTZ,
    checkin_location JSONB,
    points_awarded INTEGER DEFAULT 0,
    UNIQUE(activity_id, user_id)
);

-- =============================================
-- 6. ACTIVITY CHAT MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. RIDES TABLE (Carpooling)
-- =============================================
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    origin TEXT NOT NULL,
    origin_coordinates JSONB,
    destination TEXT NOT NULL,
    destination_coordinates JSONB,
    departure_time TIMESTAMPTZ NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10,2),
    notes TEXT,
    ride_type VARCHAR(20) DEFAULT 'offer',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. RIDE BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ride_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seats_booked INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    booking_time TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    UNIQUE(ride_id, passenger_id)
);

-- =============================================
-- 9. RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rater_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rating_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rater_id, ride_id),
    UNIQUE(rater_id, activity_id)
);

-- =============================================
-- 10. MARKETPLACE ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    condition VARCHAR(50),
    location TEXT,
    images TEXT[],
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. MARKETPLACE FAVORITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- =============================================
-- 12. MARKETPLACE COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS marketplace_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. MESSAGES TABLE (Direct Messages)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    thread_id UUID,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    context_type VARCHAR(50),
    context_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. MESSAGE REACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- =============================================
-- 15. USER BLOCKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- =============================================
-- 16. SYSTEM MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'announcement',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 17. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 18. POINTS TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    balance_after INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. COUPONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50),
    discount_value DECIMAL(10,2),
    merchant VARCHAR(255),
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 20. FRIENDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- =============================================
-- 21. GROUP CHAT MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS group_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_is_visible ON users(is_visible);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_organizer ON activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_group ON activities(group_id);

-- Rides indexes
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_type ON rides(ride_type);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_items(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- CREATE UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_items_updated_at ON marketplace_items;
CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON marketplace_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE - Database schema created successfully
-- =============================================
