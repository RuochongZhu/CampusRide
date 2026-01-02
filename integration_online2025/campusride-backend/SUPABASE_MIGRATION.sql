-- Complete database migration SQL for Supabase
-- Execute these commands in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing records with default values
UPDATE users SET major = 'Computer Science' WHERE major IS NULL;
UPDATE users SET university = 'Cornell University' WHERE university IS NULL;
UPDATE users SET points = 0 WHERE points IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- Create missing tables
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  base_points INTEGER NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(50),
  reason TEXT,
  metadata JSONB,
  multiplier INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  points INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default point rules
INSERT INTO point_rules (rule_type, name, base_points, description, category) VALUES
('registration', '用户注册', 10, '成功注册账户获得积分', 'system'),
('verification', '邮箱验证', 5, '完成邮箱验证获得积分', 'system'),
('daily_login', '每日登录', 1, '每日首次登录获得积分', 'system'),
('profile_complete', '完善资料', 15, '完善用户资料获得积分', 'system')
ON CONFLICT (rule_type) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_category_period ON leaderboard_entries(category, period_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);

-- Create a trigger to automatically update user points when transactions are added
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total points
  UPDATE users 
  SET points = (
    SELECT COALESCE(SUM(points * multiplier), 0)
    FROM point_transactions 
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for point transactions
DROP TRIGGER IF EXISTS trigger_update_user_points ON point_transactions;
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

-- Add some initial points for existing users (optional)
INSERT INTO point_transactions (user_id, rule_type, points, source, reason)
SELECT 
  id,
  'registration',
  10,
  'system',
  '初始注册积分'
FROM users
WHERE verification_status = 'verified'
ON CONFLICT DO NOTHING;