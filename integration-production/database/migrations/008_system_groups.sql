-- Add is_system column to groups table if it doesn't exist
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Create system groups for Carpooling and Marketplace
-- These are special groups that all users can access

-- Insert Carpooling system group
INSERT INTO groups (id, name, description, creator_id, is_system, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Carpooling',
  'Find and share rides with fellow students',
  '00000000-0000-0000-0000-000000000000'::uuid,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert Marketplace system group
INSERT INTO groups (id, name, description, creator_id, is_system, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Marketplace',
  'Buy and sell items with other students',
  '00000000-0000-0000-0000-000000000000'::uuid,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add index for system groups
CREATE INDEX IF NOT EXISTS idx_groups_is_system ON groups(is_system);

