-- Create notifications table for booking request system
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'trip_update', 'trip_cancelled')),
  trip_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  booking_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'read', 'unread')),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_driver_id ON notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_passenger_id ON notifications(passenger_id);
CREATE INDEX IF NOT EXISTS idx_notifications_trip_id ON notifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

COMMENT ON TABLE notifications IS 'Stores notifications for booking requests and trip updates';







