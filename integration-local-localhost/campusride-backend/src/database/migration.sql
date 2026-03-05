-- Migration script to add missing columns to existing database
-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS major VARCHAR(255),
ADD COLUMN IF NOT EXISTS university VARCHAR(255),
ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(355),
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Update existing records with default values
UPDATE users 
SET 
  major = 'Computer Science' WHERE major IS NULL,
  university = 'Cornell University' WHERE university IS NULL,
  points = 0 WHERE points IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- Create missing tables if they don't exist
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