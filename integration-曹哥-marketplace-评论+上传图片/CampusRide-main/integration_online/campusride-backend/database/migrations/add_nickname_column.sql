-- Add nickname column to users table
-- This column will store the user's display name/nickname

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NOT NULL DEFAULT '';

-- Create index for nickname searches
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Update existing users to have a default nickname based on their netid
UPDATE users 
SET nickname = COALESCE(NULLIF(nickname, ''), first_name) 
WHERE nickname = '' OR nickname IS NULL;