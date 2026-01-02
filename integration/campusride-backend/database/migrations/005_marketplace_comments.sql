-- Marketplace Comments Schema

-- Create marketplace_comments table
CREATE TABLE IF NOT EXISTS marketplace_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_marketplace_comments_item_id ON marketplace_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_user_id ON marketplace_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_parent ON marketplace_comments(parent_comment_id);

-- Create marketplace_comment_likes table
CREATE TABLE IF NOT EXISTS marketplace_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON marketplace_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON marketplace_comment_likes(user_id);

-- Trigger to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON marketplace_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_comments_updated_at
BEFORE UPDATE ON marketplace_comments
FOR EACH ROW EXECUTE FUNCTION update_marketplace_comments_updated_at();
