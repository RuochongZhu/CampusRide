# 2小时取消限制 - 快速测试指南

## 🧪 快速测试步骤

### 准备工作
1. 确保前后端服务正在运行
2. 准备两个测试账号：一个作为司机，一个作为乘客

---

## 测试1: 司机取消行程（2小时以上 - 应该成功）

### 步骤：
1. 登录司机账号
2. 创建一个新的拼车行程，出发时间设置为**当前时间+3小时**
3. 创建成功后，立即尝试取消该行程
4. **预期结果**: ✅ 取消成功

### API测试命令：
```bash
# 1. 创建行程（替换YOUR_TOKEN和时间）
DEPARTURE_TIME=$(date -u -v+3H +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3001/api/v1/rideshare/rides \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试行程",
    "departure_location": "校门口",
    "destination_location": "火车站",
    "departure_time": "'$DEPARTURE_TIME'",
    "available_seats": 3,
    "price_per_seat": 10
  }'

# 2. 取消行程（替换RIDE_ID和YOUR_TOKEN）
curl -X DELETE http://localhost:3001/api/v1/rideshare/rides/RIDE_ID \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

---

## 测试2: 司机取消行程（2小时内 - 应该失败）

### 步骤：
1. 登录司机账号
2. 创建一个新的拼车行程，出发时间设置为**当前时间+1.5小时**
3. 创建成功后，立即尝试取消该行程
4. **预期结果**: ❌ 取消失败，返回错误消息："司机不能在出发前2小时内取消行程"

### API测试命令：
```bash
# 1. 创建行程（1.5小时后出发）
DEPARTURE_TIME=$(date -u -v+90M +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3001/api/v1/rideshare/rides \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试行程2",
    "departure_location": "校门口",
    "destination_location": "机场",
    "departure_time": "'$DEPARTURE_TIME'",
    "available_seats": 2,
    "price_per_seat": 20
  }'

# 2. 尝试取消行程（应该失败）
curl -X DELETE http://localhost:3001/api/v1/rideshare/rides/RIDE_ID \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"

# 预期响应：
# {
#   "success": false,
#   "error": {
#     "message": "司机不能在出发前2小时内取消行程",
#     "code": "VALIDATION_ERROR"
#   }
# }
```

---

## 测试3: 乘客取消预订（2小时以上 - 应该成功）

### 步骤：
1. 登录司机账号，创建行程（出发时间+3小时）
2. 登录乘客账号，预订该行程
3. 预订成功后，乘客尝试取消预订
4. **预期结果**: ✅ 取消成功

### API测试命令：
```bash
# 1. 乘客预订行程
curl -X POST http://localhost:3001/api/v1/rideshare/rides/RIDE_ID/book \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatsBooked": 1,
    "pickupLocation": "宿舍楼下",
    "contactNumber": "13800138000"
  }'

# 2. 取消预订（替换BOOKING_ID）
curl -X DELETE http://localhost:3001/api/v1/rideshare/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN"
```

---

## 测试4: 乘客取消预订（2小时内 - 应该失败）

### 步骤：
1. 登录司机账号，创建行程（出发时间+1小时）
2. 登录乘客账号，预订该行程
3. 预订成功后，乘客尝试取消预订
4. **预期结果**: ❌ 取消失败，返回错误消息："乘客不能在出发前2小时内取消预订"

### API测试命令：
```bash
# 1. 创建行程（1小时后出发）
DEPARTURE_TIME=$(date -u -v+1H +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3001/api/v1/rideshare/rides \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "紧急行程",
    "departure_location": "图书馆",
    "destination_location": "市中心",
    "departure_time": "'$DEPARTURE_TIME'",
    "available_seats": 2,
    "price_per_seat": 15
  }'

# 2. 乘客预订
curl -X POST http://localhost:3001/api/v1/rideshare/rides/RIDE_ID/book \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatsBooked": 1,
    "pickupLocation": "图书馆门口",
    "contactNumber": "13800138000"
  }'

# 3. 尝试取消预订（应该失败）
curl -X DELETE http://localhost:3001/api/v1/rideshare/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN"

# 预期响应：
# {
#   "success": false,
#   "error": {
#     "message": "乘客不能在出发前2小时内取消预订",
#     "code": "VALIDATION_ERROR"
#   }
# }
```

---

## 测试5: 临界点测试（恰好2小时）

### 步骤：
1. 创建一个出发时间为**当前时间+2小时**的行程
2. 立即尝试取消
3. **预期结果**: ✅ 应该成功（hoursDiff = 2.0，不小于2）

### API测试命令：
```bash
# 创建行程（恰好2小时后）
DEPARTURE_TIME=$(date -u -v+2H +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3001/api/v1/rideshare/rides \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "临界测试",
    "departure_location": "A地",
    "destination_location": "B地",
    "departure_time": "'$DEPARTURE_TIME'",
    "available_seats": 3,
    "price_per_seat": 10
  }'

# 立即取消（应该成功）
curl -X DELETE http://localhost:3001/api/v1/rideshare/rides/RIDE_ID \
  -H "Authorization: Bearer YOUR_DRIVER_TOKEN"
```

---

## 📊 测试结果记录表

| 测试编号 | 场景 | 出发时间 | 操作 | 预期结果 | 实际结果 | 状态 |
|---------|------|---------|------|---------|---------|------|
| 1 | 司机取消 | +3小时 | 取消行程 | ✅ 成功 | | ⬜️ |
| 2 | 司机取消 | +1.5小时 | 取消行程 | ❌ 失败 | | ⬜️ |
| 3 | 乘客取消 | +3小时 | 取消预订 | ✅ 成功 | | ⬜️ |
| 4 | 乘客取消 | +1小时 | 取消预订 | ❌ 失败 | | ⬜️ |
| 5 | 临界点 | +2小时 | 取消行程 | ✅ 成功 | | ⬜️ |

---

## 🔧 调试提示

### 查看后端日志
```bash
tail -f campusride-backend/backend.log
```

### 获取token（如果需要）
```bash
# 登录获取token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "password": "password123"
  }'
```

### 检查行程详情
```bash
curl http://localhost:3001/api/v1/rideshare/rides/RIDE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ 测试通过标准

所有以下测试都应该通过：
- [x] 2小时以上可以正常取消
- [x] 2小时内无法取消（返回正确错误消息）
- [x] 临界点（恰好2小时）可以取消
- [x] 司机和乘客的取消都受到限制
- [x] 错误消息清晰易懂（中文）

---

**测试完成日期**: __________  
**测试人**: __________  
**结果**: ✅ 通过 / ❌ 未通过

