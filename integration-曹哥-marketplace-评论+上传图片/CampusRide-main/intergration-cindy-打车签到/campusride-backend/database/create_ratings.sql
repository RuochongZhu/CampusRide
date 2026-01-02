-- 创建评分系统表
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  ratee_id UUID NOT NULL,
  role_of_rater VARCHAR(20) NOT NULL CHECK (role_of_rater IN ('driver', 'passenger')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：同一行程、同一评价人对同一被评价人只能评一次
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),
  
  -- 不能给自己评分
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);

-- 创建索引
CREATE INDEX idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- 更新 ride_bookings 表的状态约束（添加新状态）
ALTER TABLE ride_bookings DROP CONSTRAINT IF EXISTS ride_bookings_status_check;

ALTER TABLE ride_bookings 
ADD CONSTRAINT ride_bookings_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'rejected',
  'cancelled',
  'canceled_by_passenger',
  'canceled_by_driver',
  'completed',
  'no_show'
));

COMMENT ON TABLE ratings IS 'User ratings and reviews for completed trips';
COMMENT ON CONSTRAINT unique_rating_per_trip ON ratings IS 'Prevents duplicate ratings from the same user for the same person on the same trip';
COMMENT ON CONSTRAINT no_self_rating ON ratings IS 'Users cannot rate themselves';




