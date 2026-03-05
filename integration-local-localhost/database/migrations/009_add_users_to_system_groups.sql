-- Add all users to system groups
-- This ensures every user can access Carpooling and Marketplace groups

-- Add all users to Carpooling group
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid as group_id,
  id as user_id,
  'member' as role,
  NOW() as joined_at
FROM users
WHERE id != '00000000-0000-0000-0000-000000000000'::uuid
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Add all users to Marketplace group
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT
  '00000000-0000-0000-0000-000000000002'::uuid as group_id,
  id as user_id,
  'member' as role,
  NOW() as joined_at
FROM users
WHERE id != '00000000-0000-0000-0000-000000000000'::uuid
ON CONFLICT (group_id, user_id) DO NOTHING;
