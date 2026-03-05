-- Marketplace Schema Migration
-- This migration creates tables for the marketplace functionality

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    location VARCHAR(255),
    images JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create item_favorites table
CREATE TABLE IF NOT EXISTS item_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON marketplace_items(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_created_at ON marketplace_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_condition ON marketplace_items(condition);

CREATE INDEX IF NOT EXISTS idx_item_favorites_user_id ON item_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_item_favorites_item_id ON item_favorites(item_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_items_updated_at
    BEFORE UPDATE ON marketplace_items
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_items_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active items
CREATE POLICY "Anyone can view active marketplace items"
    ON marketplace_items FOR SELECT
    USING (status = 'active');

-- Policy: Sellers can view their own items (including inactive)
CREATE POLICY "Sellers can view their own items"
    ON marketplace_items FOR SELECT
    USING (seller_id = auth.uid());

-- Policy: Authenticated users can create items
CREATE POLICY "Authenticated users can create items"
    ON marketplace_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND seller_id = auth.uid());

-- Policy: Sellers can update their own items
CREATE POLICY "Sellers can update their own items"
    ON marketplace_items FOR UPDATE
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

-- Policy: Sellers can delete their own items
CREATE POLICY "Sellers can delete their own items"
    ON marketplace_items FOR DELETE
    USING (seller_id = auth.uid());

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
    ON item_favorites FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can add favorites
CREATE POLICY "Users can add favorites"
    ON item_favorites FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Policy: Users can remove their own favorites
CREATE POLICY "Users can remove their own favorites"
    ON item_favorites FOR DELETE
    USING (user_id = auth.uid());

-- Create views for easier querying
CREATE OR REPLACE VIEW marketplace_items_with_seller AS
SELECT
    mi.*,
    u.first_name AS seller_first_name,
    u.last_name AS seller_last_name,
    u.university AS seller_university,
    u.points AS seller_points
FROM marketplace_items mi
LEFT JOIN users u ON mi.seller_id = u.id;

-- Grant permissions (adjust based on your setup)
-- GRANT ALL ON marketplace_items TO authenticated;
-- GRANT ALL ON item_favorites TO authenticated;
-- GRANT SELECT ON marketplace_items_with_seller TO authenticated;
