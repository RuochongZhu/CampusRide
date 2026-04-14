-- Ride-linked carpool group chats (driver + all passengers who booked)
-- Chat is active until departure_time + 1 hour (enforced in application on send).

ALTER TABLE groups ADD COLUMN IF NOT EXISTS ride_id UUID REFERENCES rides(id) ON DELETE CASCADE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS chat_expires_at TIMESTAMPTZ;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_kind VARCHAR(32) NOT NULL DEFAULT 'community';

COMMENT ON COLUMN groups.ride_id IS 'When set, this group is the carpool chat for this ride';
COMMENT ON COLUMN groups.chat_expires_at IS 'For ride_carpool groups: messaging allowed until this time';
COMMENT ON COLUMN groups.group_kind IS 'community | ride_carpool';

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_ride_id_unique ON groups(ride_id) WHERE ride_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_group_kind ON groups(group_kind);
