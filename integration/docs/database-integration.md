# 集成测试数据库同步指南

## 步骤1：准备集成环境

```bash
# 1. 创建集成测试分支
git checkout -b integration-test

# 2. 合并各个功能分支
git merge feature/user-auth-zhang
git merge feature/ride-management-li  
git merge feature/payment-wang

# 3. 解决代码冲突
```

## 步骤2：数据库迁移同步

```bash
# 1. 切换到集成测试数据库
cp .env.integration .env

# 2. 执行所有迁移文件
./scripts/migrate.sh

# 3. 验证数据库结构
npm run db:check
```

## 步骤3：数据集成测试

```bash
# 1. 启动后端服务
cd campusride-backend
npm run dev

# 2. 启动前端服务  
cd ..
npm run dev

# 3. 运行集成测试
npm run test:integration
```

## 解决数据冲突的策略

### 表结构冲突
- 所有人必须从基础schema开始
- 个人迁移文件命名：`序号_功能_姓名.sql`
- 集成前检查字段命名冲突

### 数据依赖处理
```sql
-- 示例：如果李四的功能依赖张三的用户表
-- 李四需要确保在自己的迁移中引用正确的用户表结构
INSERT INTO rides (driver_id, ...) VALUES 
((SELECT id FROM users WHERE email = 'test@example.com'), ...);
```

### 测试数据同步
```javascript
// database/seeds/integration-test-data.js
module.exports = {
  users: [
    // 张三提供的测试用户
    { email: 'driver1@test.com', name: '测试司机1' },
    { email: 'passenger1@test.com', name: '测试乘客1' }
  ],
  rides: [
    // 李四提供的测试行程
    { driver_email: 'driver1@test.com', origin: '北京大学', destination: '清华大学' }
  ],
  bookings: [
    // 王五提供的测试订单
    { passenger_email: 'passenger1@test.com', ride_origin: '北京大学' }
  ]
};
```