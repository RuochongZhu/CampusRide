-- 李四的行程管理功能迁移
-- 文件名：003_ride_management_li.sql

-- 添加行程详细信息
ALTER TABLE rides ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS car_model VARCHAR(100);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS car_plate VARCHAR(20);

-- 创建行程点评表
CREATE TABLE IF NOT EXISTS ride_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建行程申请表
CREATE TABLE IF NOT EXISTS ride_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id),
    requested_seats INTEGER,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_ride ON ride_reviews(ride_id);
CREATE INDEX IF NOT EXISTS idx_requests_ride ON ride_requests(ride_id);