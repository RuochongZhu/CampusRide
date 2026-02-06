-- 添加用户禁言表
CREATE TABLE IF NOT EXISTS group_muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unmuted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

-- 添加消息撤回表
CREATE TABLE IF NOT EXISTS group_message_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  deleted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_group_muted_users_group_id ON group_muted_users(group_id);
CREATE INDEX IF NOT EXISTS idx_group_muted_users_user_id ON group_muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_message_deletions_message_id ON group_message_deletions(message_id);

-- 修改group_messages表，添加is_deleted字段
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
