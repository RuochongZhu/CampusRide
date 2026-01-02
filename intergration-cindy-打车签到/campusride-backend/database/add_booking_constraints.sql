-- 添加 UNIQUE 约束防止重复预订
-- Execute this in Supabase SQL Editor

-- 1. 添加唯一约束：同一乘客不能重复预订同一行程
ALTER TABLE ride_bookings 
ADD CONSTRAINT unique_passenger_per_ride 
UNIQUE (ride_id, passenger_id);

-- 2. 添加检查约束：座位数必须大于0
ALTER TABLE ride_bookings 
ADD CONSTRAINT check_seats_positive 
CHECK (seats_booked > 0);

-- 3. 为rides表的status字段添加检查约束
ALTER TABLE rides 
DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE rides 
ADD CONSTRAINT rides_status_check 
CHECK (status IN ('active', 'full', 'completed', 'cancelled'));

COMMENT ON CONSTRAINT unique_passenger_per_ride ON ride_bookings IS 'Prevents a passenger from booking the same ride multiple times';
COMMENT ON CONSTRAINT check_seats_positive ON ride_bookings IS 'Ensures seats_booked is always positive';







