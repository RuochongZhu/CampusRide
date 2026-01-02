-- ================================================
-- Groups & Thoughts Schema Migration
-- 地理位置社交小组系统数据库结构
-- ================================================

-- ================================================
-- 1. 创建 groups 表
-- ================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 2. 创建 group_members 表
-- ================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'creator' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- ================================================
-- 3. 创建 thoughts 表
-- ================================================
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- NULL 表示全局想法
  content TEXT NOT NULL,
  location JSONB NOT NULL, -- {lat: number, lng: number, address: string}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 4. 创建 user_visibility 表
-- ================================================
CREATE TABLE IF NOT EXISTS user_visibility (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT true,
  current_location JSONB, -- {lat: number, lng: number}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 5. 创建索引
-- ================================================

-- groups 表索引
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

-- group_members 表索引
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- thoughts 表索引
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_group_id ON thoughts(group_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at DESC);

-- user_visibility 表索引
CREATE INDEX IF NOT EXISTS idx_user_visibility_is_visible ON user_visibility(is_visible);

-- ================================================
-- 6. 创建触发器函数
-- ================================================

-- 自动更新 groups.updated_at
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新小组成员数
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. 绑定触发器
-- ================================================

-- groups updated_at 触发器
DROP TRIGGER IF EXISTS trigger_update_groups_updated_at ON groups;
CREATE TRIGGER trigger_update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_groups_updated_at();

-- group_members 成员数触发器
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;
CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- ================================================
-- 8. 创建视图（方便查询）
-- ================================================

CREATE OR REPLACE VIEW groups_with_creator AS
SELECT
  g.*,
  u.first_name AS creator_first_name,
  u.last_name AS creator_last_name,
  u.university AS creator_university,
  u.avatar_url AS creator_avatar
FROM groups g
LEFT JOIN users u ON g.creator_id = u.id;

CREATE OR REPLACE VIEW thoughts_with_user AS
SELECT
  t.*,
  u.first_name,
  u.last_name,
  u.avatar_url,
  u.university,
  g.name AS group_name
FROM thoughts t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN groups g ON t.group_id = g.id;

-- ================================================
-- 完成
-- ================================================
-- 验证表是否创建成功:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('groups', 'group_members', 'thoughts', 'user_visibility');
