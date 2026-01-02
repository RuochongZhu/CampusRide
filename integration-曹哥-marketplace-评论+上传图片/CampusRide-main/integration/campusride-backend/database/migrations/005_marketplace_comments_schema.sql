-- Marketplace Comments System Migration
-- Create tables for commenting on marketplace items with reply functionality

-- Comments table for marketplace items
CREATE TABLE IF NOT EXISTS marketplace_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_item_id ON marketplace_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_user_id ON marketplace_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_parent_id ON marketplace_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_created_at ON marketplace_comments(created_at DESC);

-- Comment likes/reactions table
CREATE TABLE IF NOT EXISTS marketplace_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES marketplace_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'helpful', 'thumbs_up')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_comment_likes_comment_id ON marketplace_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comment_likes_user_id ON marketplace_comment_likes(user_id);

-- Add likes count to comments (denormalized for performance)
ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_comments_updated_at ON marketplace_comments;
CREATE TRIGGER trigger_marketplace_comments_updated_at
    BEFORE UPDATE ON marketplace_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_comments_updated_at();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_comments
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_likes_count ON marketplace_comment_likes;
CREATE TRIGGER trigger_comment_likes_count
    AFTER INSERT OR DELETE ON marketplace_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE marketplace_comments
        SET replies_count = replies_count + 1
        WHERE id = NEW.parent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE marketplace_comments
        SET replies_count = replies_count - 1
        WHERE id = OLD.parent_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_replies_count ON marketplace_comments;
CREATE TRIGGER trigger_comment_replies_count
    AFTER INSERT OR DELETE ON marketplace_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_replies_count();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_comment_likes ENABLE ROW LEVEL SECURITY;

-- Comments RLS policies
CREATE POLICY "marketplace_comments_select" ON marketplace_comments
    FOR SELECT USING (
        -- Allow reading comments on active items
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_comments.item_id
            AND status = 'active'
        )
    );

CREATE POLICY "marketplace_comments_insert" ON marketplace_comments
    FOR INSERT WITH CHECK (
        -- Users can only insert comments with their own user_id
        auth.uid() = user_id
        AND
        -- Can only comment on active items
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_comments.item_id
            AND status = 'active'
        )
    );

CREATE POLICY "marketplace_comments_update" ON marketplace_comments
    FOR UPDATE USING (
        -- Users can only update their own comments
        auth.uid() = user_id
    ) WITH CHECK (
        -- Ensure they don't change user_id or item_id
        auth.uid() = user_id
    );

CREATE POLICY "marketplace_comments_delete" ON marketplace_comments
    FOR DELETE USING (
        -- Users can delete their own comments or item sellers can delete comments on their items
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_comments.item_id
            AND seller_id = auth.uid()
        )
    );

-- Comment likes RLS policies
CREATE POLICY "marketplace_comment_likes_select" ON marketplace_comment_likes
    FOR SELECT USING (true); -- Anyone can see likes

CREATE POLICY "marketplace_comment_likes_insert" ON marketplace_comment_likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND
        -- Can only like comments on active items
        EXISTS (
            SELECT 1 FROM marketplace_comments c
            JOIN marketplace_items i ON c.item_id = i.id
            WHERE c.id = marketplace_comment_likes.comment_id
            AND i.status = 'active'
        )
    );

CREATE POLICY "marketplace_comment_likes_delete" ON marketplace_comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments count to marketplace_items table
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Function to update item comments count
CREATE OR REPLACE FUNCTION update_item_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
        -- Only count top-level comments, not replies
        UPDATE marketplace_items
        SET comments_count = comments_count + 1
        WHERE id = NEW.item_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
        UPDATE marketplace_items
        SET comments_count = comments_count - 1
        WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_item_comments_count ON marketplace_comments;
CREATE TRIGGER trigger_item_comments_count
    AFTER INSERT OR DELETE ON marketplace_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_item_comments_count();

-- Create some test data (optional)
-- Uncomment the lines below to create test comments

-- INSERT INTO marketplace_comments (item_id, user_id, content)
-- SELECT
--     i.id,
--     i.seller_id,
--     'This is a test comment on ' || i.title
-- FROM marketplace_items i
-- WHERE i.status = 'active'
-- LIMIT 3;

-- Grant necessary permissions
GRANT ALL ON marketplace_comments TO authenticated;
GRANT ALL ON marketplace_comment_likes TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;