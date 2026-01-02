-- Add ride_type column to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) DEFAULT 'offer';
ALTER TABLE rides ADD CONSTRAINT check_ride_type CHECK (ride_type IN ('offer', 'request'));

-- Add additional preference columns
ALTER TABLE rides ADD COLUMN IF NOT EXISTS flexibility VARCHAR(50);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS preferred_gender VARCHAR(20);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS allow_smoking BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS luggage_space VARCHAR(50);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_type ON rides(ride_type);
CREATE INDEX IF NOT EXISTS idx_rides_status_type ON rides(status, ride_type);
CREATE INDEX IF NOT EXISTS idx_rides_departure_date ON rides(departure_date);

-- Update existing rides to be 'offer' type
UPDATE rides SET ride_type = 'offer' WHERE ride_type IS NULL;
