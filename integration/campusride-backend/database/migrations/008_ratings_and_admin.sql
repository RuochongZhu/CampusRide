-- 008_ratings_and_admin.sql
-- Migration for rating system and admin features
-- Execute this in Supabase SQL Editor

-- ================================================
-- 1. Create ratings table
-- ================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_of_rater VARCHAR(20) NOT NULL CHECK (role_of_rater IN ('driver', 'passenger')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: same trip, same rater can only rate same person once
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),

  -- Cannot rate yourself
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);

-- Create indexes for ratings table
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- ================================================
-- 2. Add rating fields to users table
-- ================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create index for avg_rating
CREATE INDEX IF NOT EXISTS idx_users_avg_rating ON users(avg_rating DESC) WHERE avg_rating IS NOT NULL;

-- ================================================
-- 3. Add admin-related fields to users table
-- ================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;

-- ================================================
-- 4. Create admin_actions table for audit logging
-- ================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- ================================================
-- 5. Create function to calculate user average rating
-- ================================================
CREATE OR REPLACE FUNCTION calculate_user_avg_rating(user_id UUID)
RETURNS TABLE(avg_rating DECIMAL(3,2), total_ratings INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(score)::numeric, 2)::DECIMAL(3,2) as avg_rating,
    COUNT(*)::INTEGER as total_ratings
  FROM ratings
  WHERE ratee_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. Create trigger function to auto-update user rating
-- ================================================
CREATE OR REPLACE FUNCTION update_user_rating_on_new_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ratee's average rating
  UPDATE users
  SET
    avg_rating = (
      SELECT ROUND(AVG(score)::numeric, 2)
      FROM ratings
      WHERE ratee_id = NEW.ratee_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings
      WHERE ratee_id = NEW.ratee_id
    )
  WHERE id = NEW.ratee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. Create trigger for auto rating update
-- ================================================
DROP TRIGGER IF EXISTS trigger_update_user_rating ON ratings;
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_on_new_rating();

-- ================================================
-- 8. Comments for documentation
-- ================================================
COMMENT ON TABLE ratings IS 'User ratings and reviews for completed trips';
COMMENT ON CONSTRAINT unique_rating_per_trip ON ratings IS 'Prevents duplicate ratings from the same user for the same person on the same trip';
COMMENT ON CONSTRAINT no_self_rating ON ratings IS 'Users cannot rate themselves';
COMMENT ON COLUMN users.avg_rating IS 'Average rating received from all ratings (1.00-5.00)';
COMMENT ON COLUMN users.total_ratings IS 'Total number of ratings received';
COMMENT ON COLUMN users.is_banned IS 'Whether user is banned by admin';
COMMENT ON COLUMN users.banned_at IS 'Timestamp when user was banned';
COMMENT ON COLUMN users.ban_reason IS 'Reason for the ban';
COMMENT ON TABLE admin_actions IS 'Audit log for admin actions';
COMMENT ON FUNCTION calculate_user_avg_rating IS 'Calculate and return user average rating and total count';
COMMENT ON FUNCTION update_user_rating_on_new_rating IS 'Automatically update user avg_rating when new rating is added';
