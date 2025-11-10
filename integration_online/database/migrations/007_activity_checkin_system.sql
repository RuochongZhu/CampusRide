-- 007_activity_checkin_system.sql
-- Migration to add check-in functionality for activities

-- Add check-in fields to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_enabled BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_start_offset INTEGER DEFAULT 30; -- minutes before start_time
ALTER TABLE activities ADD COLUMN IF NOT EXISTS checkin_end_offset INTEGER DEFAULT 30; -- minutes after end_time
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_verification BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS verification_radius INTEGER DEFAULT 100; -- meters
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 10;

-- Add check-in fields to activity_participants table
ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS checkin_location JSONB;
ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS distance_from_venue DECIMAL(10,2);
ALTER TABLE activity_participants ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;

-- Create activity_checkins table for detailed check-in history
CREATE TABLE IF NOT EXISTS activity_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participation_id UUID REFERENCES activity_participants(id) ON DELETE CASCADE,
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_location JSONB NOT NULL, -- {latitude, longitude, accuracy}
  activity_location JSONB, -- {latitude, longitude} from activity
  distance_meters DECIMAL(10,2),
  location_verified BOOLEAN DEFAULT false,
  verification_radius INTEGER,
  device_info JSONB, -- browser/device details
  ip_address INET,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_checkins_activity_id ON activity_checkins(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_checkins_user_id ON activity_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_checkins_time ON activity_checkins(checkin_time);

-- Create function to calculate distance between two points (in meters)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Earth radius in meters
  lat1_rad DECIMAL;
  lat2_rad DECIMAL;
  delta_lat DECIMAL;
  delta_lon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  lat1_rad := radians(lat1);
  lat2_rad := radians(lat2);
  delta_lat := radians(lat2 - lat1);
  delta_lon := radians(lon2 - lon1);

  a := sin(delta_lat / 2) * sin(delta_lat / 2) +
       cos(lat1_rad) * cos(lat2_rad) *
       sin(delta_lon / 2) * sin(delta_lon / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if current time is within check-in period
CREATE OR REPLACE FUNCTION is_checkin_period(
  activity_start_time TIMESTAMP WITH TIME ZONE,
  activity_end_time TIMESTAMP WITH TIME ZONE,
  checkin_start_offset INTEGER DEFAULT 30,
  checkin_end_offset INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
  checkin_start TIMESTAMP WITH TIME ZONE;
  checkin_end TIMESTAMP WITH TIME ZONE;
  current_time TIMESTAMP WITH TIME ZONE;
BEGIN
  current_time := NOW();
  checkin_start := activity_start_time - (checkin_start_offset || ' minutes')::INTERVAL;
  checkin_end := activity_end_time + (checkin_end_offset || ' minutes')::INTERVAL;

  RETURN current_time >= checkin_start AND current_time <= checkin_end;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON activity_checkins TO authenticated;
GRANT USAGE ON SEQUENCE activity_checkins_id_seq TO authenticated;