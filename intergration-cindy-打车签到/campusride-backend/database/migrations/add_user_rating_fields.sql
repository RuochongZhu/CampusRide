-- 为用户表添加评分相关字段
-- Execute this in Supabase SQL Editor

-- 添加平均评分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_avg_rating ON users(avg_rating DESC) WHERE avg_rating IS NOT NULL;

-- 创建函数：计算用户的平均评分
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

-- 创建触发器函数：当添加新评分时自动更新用户评分
CREATE OR REPLACE FUNCTION update_user_rating_on_new_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新被评价人的平均评分
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

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_user_rating ON ratings;
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_on_new_rating();

-- 注释
COMMENT ON COLUMN users.avg_rating IS 'Average rating received from all ratings (1.00-5.00)';
COMMENT ON COLUMN users.total_ratings IS 'Total number of ratings received';
COMMENT ON FUNCTION calculate_user_avg_rating IS 'Calculate and return user average rating and total count';
COMMENT ON FUNCTION update_user_rating_on_new_rating IS 'Automatically update user avg_rating when new rating is added';

