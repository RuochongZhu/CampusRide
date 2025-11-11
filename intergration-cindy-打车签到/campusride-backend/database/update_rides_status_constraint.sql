-- 更新 rides 表的 status 约束，添加 'expired' 状态

-- 删除旧的约束
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;

-- 添加新的约束（包含 expired）
ALTER TABLE rides
ADD CONSTRAINT rides_status_check
CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));

-- 验证
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'rides'::regclass
AND conname = 'rides_status_check';




