-- Activity Database Setup for CampusRide
-- 创建activities和activity_participants表

-- 1. 创建activities表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'team', 'competition', 'workshop', 'seminar')),
  location VARCHAR(255) NOT NULL,
  location_coordinates JSONB,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  entry_fee_points INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  requirements TEXT,
  tags TEXT[],
  image_urls TEXT[],
  contact_info JSONB,
  checkin_code VARCHAR(6),
  location_verification BOOLEAN DEFAULT false,
  auto_complete BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建activity_participants表
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'cancelled', 'no_show')),
  registration_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checkin_time TIMESTAMP WITH TIME ZONE,
  checkin_location JSONB,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  points_earned INTEGER DEFAULT 0,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_activities_organizer_id ON activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON activities(featured);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity_id ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user_id ON activity_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_status ON activity_participants(attendance_status);
CREATE INDEX IF NOT EXISTS idx_activity_participants_registration_time ON activity_participants(registration_time DESC);

-- 4. 创建触发器函数 - 更新活动参与者数量
CREATE OR REPLACE FUNCTION update_activity_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = NEW.activity_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities 
    SET current_participants = current_participants - 1,
        updated_at = NOW()
    WHERE id = OLD.activity_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 如果状态从非registered变为registered，增加计数
    IF OLD.attendance_status != 'registered' AND NEW.attendance_status = 'registered' THEN
      UPDATE activities 
      SET current_participants = current_participants + 1,
          updated_at = NOW()
      WHERE id = NEW.activity_id;
    -- 如果状态从registered变为非registered，减少计数
    ELSIF OLD.attendance_status = 'registered' AND NEW.attendance_status != 'registered' THEN
      UPDATE activities 
      SET current_participants = current_participants - 1,
          updated_at = NOW()
      WHERE id = NEW.activity_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_activity_participant_count ON activity_participants;
CREATE TRIGGER trigger_update_activity_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON activity_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_participant_count();

-- 6. 插入测试数据
INSERT INTO activities (
  organizer_id,
  title,
  description,
  category,
  type,
  location,
  start_time,
  end_time,
  max_participants,
  entry_fee,
  reward_points,
  requirements,
  tags,
  status,
  featured
) VALUES 
(
  (SELECT id FROM users WHERE email = 'cl2822@cornell.edu' LIMIT 1),
  'CS 5582 Study Group',
  'A collaborative study session for CS 5582 students. We will focus on algorithms and data structures, preparing for the upcoming midterm exam.',
  'academic',
  'team',
  'Main Library, Room 301',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
  8,
  0,
  10,
  'Bring your laptop and course materials',
  ARRAY['Computer Science', 'Algorithms', 'Study Group'],
  'published',
  true
),
(
  (SELECT id FROM users WHERE email = 'cl2822@cornell.edu' LIMIT 1),
  'Basketball Pickup Game',
  'Casual basketball game for all skill levels. We need 4 more players to make full teams. All equipment provided.',
  'sports',
  'team',
  'Recreation Center, Court 2',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
  10,
  0,
  5,
  'Bring appropriate athletic wear and water bottle',
  ARRAY['Basketball', 'Sports', 'Recreation'],
  'published',
  false
),
(
  (SELECT id FROM users WHERE email = 'cl2822@cornell.edu' LIMIT 1),
  'Photography Walk',
  'Join us for a photography walk around campus. Perfect for beginners and experienced photographers alike.',
  'cultural',
  'individual',
  'Central Campus, Meet at Clock Tower',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days' + INTERVAL '2 hours',
  15,
  0,
  8,
  'Bring your camera or smartphone',
  ARRAY['Photography', 'Art', 'Campus Tour'],
  'published',
  false
),
(
  (SELECT id FROM users WHERE email = 'cl2822@cornell.edu' LIMIT 1),
  'Volunteer at Local Food Bank',
  'Help us serve the community by volunteering at the local food bank. Transportation provided.',
  'volunteer',
  'team',
  'Ithaca Food Bank',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '5 days' + INTERVAL '4 hours',
  20,
  0,
  15,
  'Wear comfortable clothes and closed-toe shoes',
  ARRAY['Volunteer', 'Community Service', 'Food Bank'],
  'published',
  true
),
(
  (SELECT id FROM users WHERE email = 'cl2822@cornell.edu' LIMIT 1),
  'Tech Career Workshop',
  'Learn about career opportunities in tech from industry professionals. Includes resume review and networking.',
  'career',
  'workshop',
  'Engineering Building, Room 101',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  50,
  0,
  12,
  'Bring your resume and business cards',
  ARRAY['Career', 'Technology', 'Networking'],
  'published',
  true
);

-- 7. 插入一些测试参与者数据
INSERT INTO activity_participants (activity_id, user_id, attendance_status, registration_time)
SELECT 
  a.id,
  u.id,
  'registered',
  NOW() - INTERVAL '1 hour'
FROM activities a
CROSS JOIN users u
WHERE a.title = 'CS 5582 Study Group'
  AND u.email != 'cl2822@cornell.edu'
LIMIT 3;

INSERT INTO activity_participants (activity_id, user_id, attendance_status, registration_time)
SELECT 
  a.id,
  u.id,
  'registered',
  NOW() - INTERVAL '2 hours'
FROM activities a
CROSS JOIN users u
WHERE a.title = 'Basketball Pickup Game'
  AND u.email != 'cl2822@cornell.edu'
LIMIT 5;

-- 8. 更新积分规则，添加活动相关规则
INSERT INTO point_rules (rule_type, name, base_points, description, category) VALUES
('activity_creation', '创建活动', 20, '创建新活动获得积分', 'social'),
('activity_participation', '参与活动', 10, '参与活动获得积分', 'social'),
('activity_organization', '组织活动', 30, '成功组织活动获得积分', 'social'),
('activity_checkin', '活动签到', 5, '活动签到获得积分', 'social'),
('activity_completion', '完成活动', 15, '完成活动获得积分', 'social')
ON CONFLICT (rule_type) DO NOTHING;

-- 9. 创建视图 - 活动统计
CREATE OR REPLACE VIEW activity_stats AS
SELECT 
  a.id,
  a.title,
  a.category,
  a.status,
  a.current_participants,
  a.max_participants,
  a.start_time,
  a.end_time,
  u.first_name || ' ' || u.last_name as organizer_name,
  u.avatar_url as organizer_avatar,
  CASE 
    WHEN a.max_participants IS NULL THEN 'Unlimited'
    ELSE a.current_participants || '/' || a.max_participants
  END as participant_count,
  CASE 
    WHEN a.start_time > NOW() THEN 'upcoming'
    WHEN a.start_time <= NOW() AND a.end_time > NOW() THEN 'ongoing'
    ELSE 'completed'
  END as time_status
FROM activities a
JOIN users u ON a.organizer_id = u.id;

-- 10. 创建函数 - 获取用户活动统计
CREATE OR REPLACE FUNCTION get_user_activity_stats(user_uuid UUID)
RETURNS TABLE (
  total_organized INTEGER,
  total_participated INTEGER,
  total_points_earned INTEGER,
  upcoming_activities INTEGER,
  completed_activities INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(organized.count, 0)::INTEGER as total_organized,
    COALESCE(participated.count, 0)::INTEGER as total_participated,
    COALESCE(points.total, 0)::INTEGER as total_points_earned,
    COALESCE(upcoming.count, 0)::INTEGER as upcoming_activities,
    COALESCE(completed.count, 0)::INTEGER as completed_activities
  FROM 
    (SELECT COUNT(*) as count FROM activities WHERE organizer_id = user_uuid) organized
  CROSS JOIN
    (SELECT COUNT(*) as count FROM activity_participants WHERE user_id = user_uuid) participated
  CROSS JOIN
    (SELECT COALESCE(SUM(points_earned), 0) as total FROM activity_participants WHERE user_id = user_uuid) points
  CROSS JOIN
    (SELECT COUNT(*) as count FROM activity_participants ap 
     JOIN activities a ON ap.activity_id = a.id 
     WHERE ap.user_id = user_uuid AND a.start_time > NOW()) upcoming
  CROSS JOIN
    (SELECT COUNT(*) as count FROM activity_participants ap 
     JOIN activities a ON ap.activity_id = a.id 
     WHERE ap.user_id = user_uuid AND a.end_time < NOW()) completed;
END;
$$ LANGUAGE plpgsql;

-- 完成数据库设置
SELECT 'Activity database setup completed successfully!' as status;



