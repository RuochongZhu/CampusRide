# CampusRide 数据库结构文档

## 数据库信息
- **数据库类型**: PostgreSQL (通过Supabase)
- **字符集**: UTF-8
- **时区**: UTC

## 已实现的表结构

### 1. users 表 (用户表)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  university VARCHAR(255),
  major VARCHAR(255),
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_token VARCHAR(255),
  verification_expires TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_verification_status ON users(verification_status);
```

### 2. point_rules 表 (积分规则表)
```sql
CREATE TABLE point_rules (
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

-- 插入默认积分规则
INSERT INTO point_rules (rule_type, name, base_points, description, category) VALUES
('post_creation', '发布帖子', 5, '发布一条帖子获得积分', 'social'),
('post_reply', '回复帖子', 3, '回复帖子获得积分', 'social'),
('post_like', '点赞帖子', 2, '点赞帖子获得积分', 'social'),
('post_liked', '帖子被点赞', 2, '帖子被他人点赞获得积分', 'social'),
('post_share', '转发帖子', 2, '转发帖子获得积分', 'social'),
('post_shared', '帖子被转发', 2, '帖子被他人转发获得积分', 'social');
```

### 3. point_transactions 表 (积分交易记录表)
```sql
CREATE TABLE point_transactions (
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

-- 索引
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_rule_type ON point_transactions(rule_type);
```

### 4. leaderboard_entries 表 (排行榜条目表)
```sql
CREATE TABLE leaderboard_entries (
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

-- 索引
CREATE INDEX idx_leaderboard_entries_category ON leaderboard_entries(category);
CREATE INDEX idx_leaderboard_entries_period_type ON leaderboard_entries(period_type);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(category, period_type, rank);
CREATE INDEX idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
```

## 需要创建的表结构

### 5. notifications 表 (通知表)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 6. marketplace_items 表 (市场商品表)
```sql
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  images TEXT[],
  location VARCHAR(255),
  contact_info JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_marketplace_items_user_id ON marketplace_items(user_id);
CREATE INDEX idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX idx_marketplace_items_created_at ON marketplace_items(created_at DESC);
```

### 7. rideshare_rides 表 (拼车表)
```sql
CREATE TABLE rideshare_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  available_seats INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  vehicle_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_rideshare_rides_driver_id ON rideshare_rides(driver_id);
CREATE INDEX idx_rideshare_rides_origin ON rideshare_rides(origin);
CREATE INDEX idx_rideshare_rides_destination ON rideshare_rides(destination);
CREATE INDEX idx_rideshare_rides_departure_time ON rideshare_rides(departure_time);
CREATE INDEX idx_rideshare_rides_status ON rideshare_rides(status);
```

### 8. rideshare_bookings 表 (拼车预订表)
```sql
CREATE TABLE rideshare_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rideshare_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_rideshare_bookings_ride_id ON rideshare_bookings(ride_id);
CREATE INDEX idx_rideshare_bookings_passenger_id ON rideshare_bookings(passenger_id);
CREATE INDEX idx_rideshare_bookings_status ON rideshare_bookings(status);
```

### 9. activities 表 (活动表)
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  requirements TEXT,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_activities_organizer_id ON activities(organizer_id);
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_activity_date ON activities(activity_date);
CREATE INDEX idx_activities_status ON activities(status);
```

### 10. activity_participants 表 (活动参与者表)
```sql
CREATE TABLE activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 索引
CREATE INDEX idx_activity_participants_activity_id ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_user_id ON activity_participants(user_id);
CREATE INDEX idx_activity_participants_status ON activity_participants(status);
```

## 数据库函数和触发器

### 1. 更新用户积分函数
```sql
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET points = (
    SELECT COALESCE(SUM(points), 0) 
    FROM point_transactions 
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT OR UPDATE OR DELETE ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();
```

### 2. 更新排行榜函数
```sql
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新整体排行榜
  INSERT INTO leaderboard_entries (user_id, category, period_type, period_start, period_end, points, rank)
  SELECT 
    u.id,
    'overall',
    'week',
    date_trunc('week', NOW()),
    date_trunc('week', NOW()) + interval '1 week',
    u.points,
    ROW_NUMBER() OVER (ORDER BY u.points DESC)
  FROM users u
  WHERE u.is_active = true
  ON CONFLICT (user_id, category, period_type, period_start) 
  DO UPDATE SET 
    points = EXCLUDED.points,
    rank = EXCLUDED.rank,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_leaderboard
  AFTER UPDATE OF points ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();
```

## 数据迁移脚本

### 创建所有表的完整脚本
```sql
-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  university VARCHAR(255),
  major VARCHAR(255),
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_token VARCHAR(255),
  verification_expires TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建积分规则表
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

-- 3. 创建积分交易记录表
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

-- 4. 创建排行榜条目表
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

-- 5. 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 6. 创建市场商品表
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  images TEXT[],
  location VARCHAR(255),
  contact_info JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建拼车表
CREATE TABLE IF NOT EXISTS rideshare_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  available_seats INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  vehicle_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建拼车预订表
CREATE TABLE IF NOT EXISTS rideshare_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rideshare_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 创建活动表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  requirements TEXT,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 创建活动参与者表
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 插入默认积分规则
INSERT INTO point_rules (rule_type, name, base_points, description, category) VALUES
('post_creation', '发布帖子', 5, '发布一条帖子获得积分', 'social'),
('post_reply', '回复帖子', 3, '回复帖子获得积分', 'social'),
('post_like', '点赞帖子', 2, '点赞帖子获得积分', 'social'),
('post_liked', '帖子被点赞', 2, '帖子被他人点赞获得积分', 'social'),
('post_share', '转发帖子', 2, '转发帖子获得积分', 'social'),
('post_shared', '帖子被转发', 2, '帖子被他人转发获得积分', 'social')
ON CONFLICT (rule_type) DO NOTHING;
```

## 数据库关系图

```
users (1) -----> (N) point_transactions
users (1) -----> (N) leaderboard_entries
users (1) -----> (N) notifications
users (1) -----> (N) marketplace_items
users (1) -----> (N) rideshare_rides
users (1) -----> (N) rideshare_bookings
users (1) -----> (N) activities
users (1) -----> (N) activity_participants

rideshare_rides (1) -----> (N) rideshare_bookings
activities (1) -----> (N) activity_participants
```

## 注意事项

1. **UUID主键**: 所有表都使用UUID作为主键，避免ID冲突
2. **外键约束**: 使用CASCADE删除，确保数据一致性
3. **时间戳**: 使用UTC时间戳，避免时区问题
4. **索引优化**: 为常用查询字段创建索引
5. **数据验证**: 在应用层进行数据验证，数据库层作为最后防线
6. **备份策略**: 定期备份数据库，特别是用户数据
7. **性能监控**: 监控查询性能，优化慢查询
