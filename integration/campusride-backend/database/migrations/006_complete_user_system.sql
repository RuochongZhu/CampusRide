-- 006_complete_user_system.sql
-- Complete user system with rating, activities, rides history and coupons

-- ================================================
-- 1. 确保用户表有所有必需字段
-- ================================================

-- 添加用户评分相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 添加用户统计字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_carpools INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_activities INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 添加用户状态字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT 'Cornell University';

-- ================================================
-- 2. 创建评分系统
-- ================================================

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,                              -- 行程ID
  rater_id UUID NOT NULL,                             -- 评价人ID
  ratee_id UUID NOT NULL,                             -- 被评价人ID
  role_of_rater VARCHAR(20) NOT NULL                  -- 评价人角色: 'driver' | 'passenger'
    CHECK (role_of_rater IN ('driver', 'passenger')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),  -- 评分: 1-5
  comment TEXT,                                       -- 评论（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 约束：同一行程、同一评价人对同一被评价人只能评一次
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),

  -- 不能给自己评分
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id),

  -- 外键约束
  FOREIGN KEY (trip_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建评分相关索引
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- ================================================
-- 3. 创建通知系统
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,                    -- 通知类型
  trip_id UUID,                                 -- 关联行程ID（可选）
  sender_id UUID,                               -- 发送者ID（可选）
  receiver_id UUID,                             -- 接收者ID（可选）
  booking_id UUID,                              -- 关联预订ID（可选）
  status VARCHAR(20) DEFAULT 'pending',         -- 通知状态
  message TEXT NOT NULL,                        -- 通知消息
  is_read BOOLEAN DEFAULT FALSE,                -- 是否已读
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 外键约束
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建通知系统索引
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ================================================
-- 4. 创建优惠券系统
-- ================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                       -- 用户ID
  coupon_code VARCHAR(50) NOT NULL,             -- 优惠券代码
  merchant_name VARCHAR(255) NOT NULL,          -- 商户名称
  discount_amount DECIMAL(10, 2) NOT NULL,      -- 折扣金额
  discount_type VARCHAR(20) DEFAULT 'fixed',    -- 折扣类型: 'fixed', 'percentage'
  description TEXT,                             -- 描述
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,                -- 是否已使用
  used_at TIMESTAMP WITH TIME ZONE,             -- 使用时间
  week_awarded INTEGER,                         -- 获得的周数（用于追踪排名）
  rank_position INTEGER,                        -- 当周排名
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建优惠券索引
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_used ON coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_coupons_week_awarded ON coupons(week_awarded);

-- ================================================
-- 5. 创建拉黑系统
-- ================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,                    -- 拉黑人ID
  blocked_id UUID NOT NULL,                    -- 被拉黑人ID
  reason TEXT,                                 -- 拉黑原因（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 约束：不能拉黑自己，同一对用户只能有一条记录
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id),

  -- 外键约束
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建拉黑系统索引
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);

-- ================================================
-- 6. 创建用户评分自动更新触发器
-- ================================================

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

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_user_rating ON ratings;

-- 创建触发器
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_on_new_rating();

-- ================================================
-- 7. 插入测试用户数据
-- ================================================

-- 插入测试用户（如果不存在）
INSERT INTO users (
  id, first_name, last_name, email, password,
  is_verified, avatar_url, university, is_online,
  total_carpools, total_activities, total_sales, points
) VALUES
-- 用户1: Alice Johnson - 高评分司机
(
  'user-alice-001', 'Alice', 'Johnson', 'alice.johnson@cornell.edu',
  '$2b$10$example.hash.for.alice', true,
  'https://avatars.githubusercontent.com/u/2?v=4', 'Cornell University', true,
  15, 12, 8, 320
),
-- 用户2: Bob Smith - 普通用户
(
  'user-bob-002', 'Bob', 'Smith', 'bob.smith@cornell.edu',
  '$2b$10$example.hash.for.bob', true,
  'https://avatars.githubusercontent.com/u/3?v=4', 'Cornell University', false,
  8, 15, 0, 180
),
-- 用户3: Carol Williams - 活跃用户
(
  'user-carol-003', 'Carol', 'Williams', 'carol.williams@cornell.edu',
  '$2b$10$example.hash.for.carol', true,
  'https://avatars.githubusercontent.com/u/4?v=4', 'Cornell University', true,
  20, 25, 15, 450
),
-- 用户4: David Brown - 新用户
(
  'user-david-004', 'David', 'Brown', 'david.brown@cornell.edu',
  '$2b$10$example.hash.for.david', true,
  'https://avatars.githubusercontent.com/u/5?v=4', 'Cornell University', true,
  5, 18, 0, 210
),
-- 用户5: Emma Davis - 高分卖家
(
  'user-emma-005', 'Emma', 'Davis', 'emma.davis@cornell.edu',
  '$2b$10$example.hash.for.emma', true,
  'https://avatars.githubusercontent.com/u/6?v=4', 'Cornell University', true,
  3, 8, 25, 380
),
-- 用户6: Frank Miller - 司机专家
(
  'user-frank-006', 'Frank', 'Miller', 'frank.miller@cornell.edu',
  '$2b$10$example.hash.for.frank', true,
  'https://avatars.githubusercontent.com/u/7?v=4', 'Cornell University', false,
  30, 5, 0, 285
),
-- 用户7: Grace Lee - 活动组织者
(
  'user-grace-007', 'Grace', 'Lee', 'grace.lee@cornell.edu',
  '$2b$10$example.hash.for.grace', true,
  'https://avatars.githubusercontent.com/u/8?v=4', 'Cornell University', true,
  2, 35, 5, 520
),
-- 用户8: Henry Wilson - 新手
(
  'user-henry-008', 'Henry', 'Wilson', 'henry.wilson@cornell.edu',
  '$2b$10$example.hash.for.henry', true,
  'https://avatars.githubusercontent.com/u/9?v=4', 'Cornell University', true,
  0, 2, 0, 50
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 8. 插入测试行程数据（为评分做准备）
-- ================================================

-- 插入一些测试行程数据
INSERT INTO rides (
  id, driver_id, title, description, departure_location, destination_location,
  departure_time, arrival_time, available_seats, price_per_seat, status
) VALUES
('trip-001', 'user-alice-001', 'Cornell to NYC', 'Regular trip to NYC', 'Cornell University', 'New York City',
 '2024-10-01 09:00:00', '2024-10-01 14:00:00', 4, 25.00, 'completed'),
('trip-002', 'user-alice-001', 'NYC to Cornell', 'Return trip', 'New York City', 'Cornell University',
 '2024-10-05 15:00:00', '2024-10-05 20:00:00', 4, 25.00, 'completed'),
('trip-003', 'user-alice-001', 'Weekend Trip', 'Weekend shopping', 'Cornell University', 'Ithaca Mall',
 '2024-10-10 12:00:00', '2024-10-10 13:30:00', 3, 10.00, 'completed'),
('trip-004', 'user-alice-001', 'Airport Run', 'To Ithaca Airport', 'Cornell University', 'Ithaca Airport',
 '2024-10-15 09:30:00', '2024-10-15 10:15:00', 3, 15.00, 'completed'),
('trip-005', 'user-alice-001', 'Study Trip', 'Library visit', 'Cornell University', 'Downtown Ithaca',
 '2024-10-20 16:00:00', '2024-10-20 17:30:00', 2, 8.00, 'completed'),
('trip-006', 'user-carol-003', 'Concert Trip', 'Syracuse concert', 'Cornell University', 'Syracuse',
 '2024-10-25 11:00:00', '2024-10-25 15:30:00', 3, 30.00, 'completed'),
('trip-007', 'user-frank-006', 'Grocery Run', 'Weekly groceries', 'Cornell University', 'Wegmans',
 '2024-11-01 14:00:00', '2024-11-01 15:30:00', 4, 5.00, 'completed'),
('trip-008', 'user-alice-001', 'Medical Visit', 'Doctor appointment', 'Cornell University', 'Cayuga Medical',
 '2024-11-05 10:30:00', '2024-11-05 12:00:00', 2, 12.00, 'completed'),
('trip-009', 'user-carol-003', 'Shopping Trip', 'Outlet shopping', 'Cornell University', 'Waterloo Outlets',
 '2024-11-08 13:00:00', '2024-11-08 18:00:00', 3, 20.00, 'completed'),
('trip-010', 'user-alice-001', 'Late Night', 'Late pickup', 'Cornell University', 'Downtown Ithaca',
 '2024-11-10 16:30:00', '2024-11-10 17:15:00', 2, 10.00, 'completed')
ON CONFLICT (id) DO NOTHING;

-- 插入更多测试行程
INSERT INTO rides (
  id, driver_id, title, description, departure_location, destination_location,
  departure_time, arrival_time, available_seats, price_per_seat, status
) VALUES
('trip-011', 'user-alice-001', 'Morning Commute', 'Early trip', 'Cornell University', 'Ithaca Commons',
 '2024-11-12 09:00:00', '2024-11-12 09:45:00', 3, 8.00, 'completed'),
('trip-012', 'user-frank-006', 'Evening Return', 'Back to campus', 'Ithaca Commons', 'Cornell University',
 '2024-11-14 12:00:00', '2024-11-14 12:30:00', 4, 6.00, 'completed'),
('trip-013', 'user-bob-002', 'Study Group', 'Library meeting', 'Cornell University', 'Ithaca Public Library',
 '2024-10-02 11:00:00', '2024-10-02 12:30:00', 2, 7.00, 'completed'),
('trip-014', 'user-bob-002', 'Coffee Run', 'Coffee shop visit', 'Cornell University', 'Gimme Coffee',
 '2024-10-07 14:00:00', '2024-10-07 15:00:00', 3, 5.00, 'completed'),
('trip-015', 'user-bob-002', 'Lunch Trip', 'Restaurant visit', 'Cornell University', 'Collegetown',
 '2024-10-12 10:30:00', '2024-10-12 12:00:00', 2, 8.00, 'completed'),
('trip-016', 'user-bob-002', 'Bank Run', 'Banking errands', 'Cornell University', 'Bank of America',
 '2024-10-18 15:00:00', '2024-10-18 16:30:00', 3, 6.00, 'completed'),
('trip-017', 'user-bob-002', 'Pharmacy Trip', 'Prescription pickup', 'Cornell University', 'CVS Pharmacy',
 '2024-10-23 09:00:00', '2024-10-23 10:30:00', 2, 7.00, 'completed'),
('trip-018', 'user-bob-002', 'Movie Night', 'Cinema visit', 'Cornell University', 'Cinemapolis',
 '2024-11-03 13:00:00', '2024-11-03 16:00:00', 3, 9.00, 'completed'),
('trip-019', 'user-bob-002', 'Dinner Out', 'Restaurant dinner', 'Cornell University', 'The Heights',
 '2024-11-07 16:30:00', '2024-11-07 18:30:00', 2, 10.00, 'completed'),
('trip-020', 'user-carol-003', 'Weekend Fun', 'Fun trip', 'Cornell University', 'State Park',
 '2024-11-11 12:00:00', '2024-11-11 17:00:00', 4, 15.00, 'completed'),
('trip-021', 'user-carol-003', 'Perfect Drive', 'Scenic route', 'Cornell University', 'Cayuga Lake',
 '2024-09-15 10:00:00', '2024-09-15 12:00:00', 3, 12.00, 'completed'),
('trip-022', 'user-carol-003', 'City Adventure', 'Urban exploration', 'Cornell University', 'Downtown Ithaca',
 '2024-09-20 14:00:00', '2024-09-20 18:00:00', 4, 18.00, 'completed'),
('trip-023', 'user-david-004', 'First Trip', 'New driver', 'Cornell University', 'Local Cafe',
 '2024-09-25 11:30:00', '2024-09-25 13:00:00', 2, 6.00, 'completed'),
('trip-024', 'user-carol-003', 'Nature Trip', 'Hiking expedition', 'Cornell University', 'Taughannock Falls',
 '2024-09-30 16:00:00', '2024-09-30 19:00:00', 4, 22.00, 'completed'),
('trip-025', 'user-carol-003', 'Service Trip', 'Community service', 'Cornell University', 'Food Bank',
 '2024-10-05 09:00:00', '2024-10-05 12:00:00', 3, 0.00, 'completed'),
('trip-026', 'user-david-004', 'Learning Drive', 'Practice trip', 'Cornell University', 'East Hill Plaza',
 '2024-10-01 12:00:00', '2024-10-01 13:30:00', 2, 8.00, 'completed'),
('trip-027', 'user-david-004', 'Confidence Trip', 'Getting better', 'Cornell University', 'Pyramid Mall',
 '2024-10-06 15:00:00', '2024-10-06 17:30:00', 3, 12.00, 'completed'),
('trip-028', 'user-david-004', 'Reliable Run', 'Trustworthy service', 'Cornell University', 'Target',
 '2024-10-11 10:00:00', '2024-10-11 12:00:00', 2, 10.00, 'completed')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 9. 插入历史评分数据
-- ================================================

-- 插入评分数据来生成合理的评分历史
INSERT INTO ratings (
  id, trip_id, rater_id, ratee_id, role_of_rater, score, comment, created_at
) VALUES
-- Alice 的评分 (4.8 平均分, 12个评分)
('rating-001', 'trip-001', 'user-bob-002', 'user-alice-001', 'passenger', 5, 'Excellent driver!', '2024-10-01 10:00:00'),
('rating-002', 'trip-002', 'user-carol-003', 'user-alice-001', 'passenger', 5, 'Very safe and punctual', '2024-10-05 15:30:00'),
('rating-003', 'trip-003', 'user-david-004', 'user-alice-001', 'passenger', 4, 'Good experience', '2024-10-10 12:15:00'),
('rating-004', 'trip-004', 'user-emma-005', 'user-alice-001', 'passenger', 5, 'Perfect trip!', '2024-10-15 09:45:00'),
('rating-005', 'trip-005', 'user-frank-006', 'user-alice-001', 'passenger', 5, 'Highly recommend', '2024-10-20 16:20:00'),
('rating-006', 'trip-006', 'user-grace-007', 'user-alice-001', 'passenger', 4, 'Nice ride', '2024-10-25 11:10:00'),
('rating-007', 'trip-007', 'user-henry-008', 'user-alice-001', 'passenger', 5, 'Amazing!', '2024-11-01 14:30:00'),
('rating-008', 'trip-008', 'user-bob-002', 'user-alice-001', 'passenger', 5, 'Another great trip', '2024-11-05 10:50:00'),
('rating-009', 'trip-009', 'user-carol-003', 'user-alice-001', 'passenger', 4, 'Reliable driver', '2024-11-08 13:25:00'),
('rating-010', 'trip-010', 'user-david-004', 'user-alice-001', 'passenger', 5, 'Excellent as always', '2024-11-10 16:40:00'),
('rating-011', 'trip-011', 'user-emma-005', 'user-alice-001', 'passenger', 5, 'Top notch service', '2024-11-12 09:15:00'),
('rating-012', 'trip-012', 'user-frank-006', 'user-alice-001', 'passenger', 5, 'Outstanding!', '2024-11-14 12:00:00'),

-- Bob 的评分 (4.6 平均分, 8个评分)
('rating-013', 'trip-013', 'user-alice-001', 'user-bob-002', 'driver', 4, 'Good passenger', '2024-10-02 11:00:00'),
('rating-014', 'trip-014', 'user-carol-003', 'user-bob-002', 'driver', 5, 'Very polite', '2024-10-07 14:30:00'),
('rating-015', 'trip-015', 'user-david-004', 'user-bob-002', 'driver', 4, 'On time', '2024-10-12 10:45:00'),
('rating-016', 'trip-016', 'user-emma-005', 'user-bob-002', 'driver', 5, 'Great company', '2024-10-18 15:20:00'),
('rating-017', 'trip-017', 'user-grace-007', 'user-bob-002', 'driver', 5, 'Friendly passenger', '2024-10-23 09:30:00'),
('rating-018', 'trip-018', 'user-henry-008', 'user-bob-002', 'driver', 4, 'No issues', '2024-11-03 13:15:00'),
('rating-019', 'trip-019', 'user-alice-001', 'user-bob-002', 'driver', 5, 'Recommended', '2024-11-07 16:50:00'),
('rating-020', 'trip-020', 'user-carol-003', 'user-bob-002', 'driver', 5, 'Excellent passenger', '2024-11-11 12:30:00'),

-- Carol 的评分 (5.0 平均分, 25个评分 - 只显示部分)
('rating-021', 'trip-021', 'user-alice-001', 'user-carol-003', 'driver', 5, 'Perfect!', '2024-09-15 10:00:00'),
('rating-022', 'trip-022', 'user-bob-002', 'user-carol-003', 'passenger', 5, 'Amazing driver', '2024-09-20 14:30:00'),
('rating-023', 'trip-023', 'user-david-004', 'user-carol-003', 'driver', 5, 'Outstanding', '2024-09-25 11:45:00'),
('rating-024', 'trip-024', 'user-emma-005', 'user-carol-003', 'passenger', 5, 'Best driver ever', '2024-09-30 16:20:00'),
('rating-025', 'trip-025', 'user-frank-006', 'user-carol-003', 'passenger', 5, 'Incredible service', '2024-10-05 09:15:00'),

-- David 的评分 (4.7 平均分, 15个评分 - 只显示部分)
('rating-026', 'trip-026', 'user-alice-001', 'user-david-004', 'driver', 5, 'Great passenger', '2024-10-01 12:00:00'),
('rating-027', 'trip-027', 'user-bob-002', 'user-david-004', 'passenger', 4, 'Good experience', '2024-10-06 15:30:00'),
('rating-028', 'trip-028', 'user-carol-003', 'user-david-004', 'driver', 5, 'Reliable', '2024-10-11 10:15:00')

ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 9. 插入优惠券数据（基于美东时间每周日排名）
-- ================================================

INSERT INTO coupons (
  id, user_id, coupon_code, merchant_name, discount_amount,
  discount_type, description, valid_until, week_awarded, rank_position
) VALUES
-- 第44周 (2024年10月27-November 3) - Grace 第一名
('coupon-001', 'user-grace-007', 'STARBUCKS15', 'Starbucks', 15.00, 'fixed',
 'Weekly Winner Reward - Top Performer', '2024-11-17 23:59:59', 44, 1),
('coupon-002', 'user-grace-007', 'SUBWAY10', 'Subway', 10.00, 'fixed',
 'Weekly Winner Bonus', '2024-11-17 23:59:59', 44, 1),

-- Carol 第二名
('coupon-003', 'user-carol-003', 'PIZZAHUT12', 'Pizza Hut', 12.00, 'fixed',
 'Second Place Weekly Reward', '2024-11-17 23:59:59', 44, 2),

-- Emma 第三名
('coupon-004', 'user-emma-005', 'DUNKIN8', 'Dunkin Donuts', 8.00, 'fixed',
 'Third Place Weekly Reward', '2024-11-17 23:59:59', 44, 3),

-- 第45周 (2024年November 3-10) - Carol 第一名
('coupon-005', 'user-carol-003', 'MCDONALDS20', 'McDonalds', 20.00, 'fixed',
 'Weekly Champion Award', '2024-11-24 23:59:59', 45, 1),
('coupon-006', 'user-carol-003', 'CHIPOTLE15', 'Chipotle', 15.00, 'fixed',
 'Champion Bonus Coupon', '2024-11-24 23:59:59', 45, 1),

-- Emma 第二名
('coupon-007', 'user-emma-005', 'TACOBELL10', 'Taco Bell', 10.00, 'fixed',
 'Runner-up Reward', '2024-11-24 23:59:59', 45, 2),

-- Alice 第三名
('coupon-008', 'user-alice-001', 'KFC12', 'KFC', 12.00, 'fixed',
 'Bronze Medal Reward', '2024-11-24 23:59:59', 45, 3),

-- 第46周 (2024年November 10-17) - Emma 第一名
('coupon-009', 'user-emma-005', 'PANERA25', 'Panera Bread', 25.00, 'fixed',
 'Top Seller of the Week', '2024-12-01 23:59:59', 46, 1),

-- 过期的优惠券示例
('coupon-010', 'user-alice-001', 'EXPIRED5', 'Local Cafe', 5.00, 'fixed',
 'Expired test coupon', '2024-10-15 23:59:59', 42, 2),

-- 已使用的优惠券示例
('coupon-011', 'user-bob-002', 'USED10', 'BookStore', 10.00, 'fixed',
 'Used coupon example', '2024-12-15 23:59:59', 43, 3)

ON CONFLICT (id) DO NOTHING;

-- 标记已使用的优惠券
UPDATE coupons
SET is_used = TRUE, used_at = '2024-11-01 15:30:00'
WHERE id = 'coupon-011';

-- ================================================
-- 10. 创建用户索引以优化查询
-- ================================================

CREATE INDEX IF NOT EXISTS idx_users_avg_rating ON users(avg_rating DESC)
WHERE avg_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

-- ================================================
-- 11. 创建视图便于查询用户完整信息
-- ================================================

CREATE OR REPLACE VIEW user_profiles AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.avatar_url,
  u.university,
  u.is_online,
  u.avg_rating,
  u.total_ratings,
  u.total_carpools,
  u.total_activities,
  u.total_sales,
  u.points,
  u.created_at,
  u.updated_at,

  -- 计算统计数据
  COALESCE(u.total_ratings, 0) as rating_count,
  CASE
    WHEN u.avg_rating IS NULL THEN 'NEW'
    WHEN u.avg_rating >= 4.8 THEN 'EXCELLENT'
    WHEN u.avg_rating >= 4.5 THEN 'VERY_GOOD'
    WHEN u.avg_rating >= 4.0 THEN 'GOOD'
    WHEN u.avg_rating >= 3.5 THEN 'FAIR'
    ELSE 'POOR'
  END as rating_level,

  -- 优惠券统计
  (SELECT COUNT(*) FROM coupons c WHERE c.user_id = u.id AND NOT c.is_used AND c.valid_until > NOW()) as active_coupons,
  (SELECT COUNT(*) FROM coupons c WHERE c.user_id = u.id AND c.is_used) as used_coupons,
  (SELECT COUNT(*) FROM coupons c WHERE c.user_id = u.id AND NOT c.is_used AND c.valid_until <= NOW()) as expired_coupons

FROM users u
WHERE u.is_verified = TRUE;

-- 授权所有用户可以查看用户资料视图
-- GRANT SELECT ON user_profiles TO authenticated; -- 取消注释在生产环境中使用

-- ================================================
-- 完成迁移
-- ================================================

-- 确保 schema_migrations 表存在
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 记录迁移完成时间
INSERT INTO schema_migrations (version, applied_at)
VALUES ('006_complete_user_system', NOW())
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();

-- 输出完成消息
SELECT 'Complete user system migration applied successfully!' AS status;