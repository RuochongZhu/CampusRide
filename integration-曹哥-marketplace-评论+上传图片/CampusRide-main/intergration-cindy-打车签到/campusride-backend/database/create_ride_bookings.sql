-- Create ride_bookings table for carpooling system
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ride_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  pickup_location VARCHAR(255),
  special_requests TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ride_id, passenger_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ride_bookings_ride_id ON ride_bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger_id ON ride_bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_status ON ride_bookings(status);
CREATE INDEX IF NOT EXISTS idx_ride_bookings_created_at ON ride_bookings(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE ride_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for ride_bookings
-- Users can view their own bookings (as passenger)
CREATE POLICY "Users can view their own bookings" ON ride_bookings
  FOR SELECT
  USING (auth.uid()::text = passenger_id::text);

-- Users can view bookings for rides they're driving
CREATE POLICY "Drivers can view bookings for their rides" ON ride_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_bookings.ride_id 
      AND rides.driver_id::text = auth.uid()::text
    )
  );

-- Users can create bookings for rides they're not driving
CREATE POLICY "Users can create bookings" ON ride_bookings
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_bookings.ride_id 
      AND rides.driver_id::text = auth.uid()::text
    )
  );

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings" ON ride_bookings
  FOR UPDATE
  USING (auth.uid()::text = passenger_id::text);

-- Users can delete/cancel their own bookings
CREATE POLICY "Users can delete their own bookings" ON ride_bookings
  FOR DELETE
  USING (auth.uid()::text = passenger_id::text);

COMMENT ON TABLE ride_bookings IS 'Stores passenger bookings for carpooling rides';




