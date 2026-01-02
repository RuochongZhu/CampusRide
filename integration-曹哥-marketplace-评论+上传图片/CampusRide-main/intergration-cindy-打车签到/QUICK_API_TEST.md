# 快速 API 测试指南

## 🚀 如何正确测试 API

### 方法 1: 使用正确的 Token（推荐）

```bash
# 步骤 1: 登录并保存 token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@cornell.edu","password":"alice1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 步骤 2: 测试 My Trips API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips \
  | python3 -m json.tool

# 步骤 3: 获取一个预订 ID（从 My Trips 结果中）
BOOKING_ID="your-actual-booking-id-here"

# 步骤 4: 取消预订
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/bookings/$BOOKING_ID \
  | python3 -m json.tool
```

### 方法 2: 运行自动化测试脚本

我创建了一个完整的测试脚本，可以自动测试取消功能：

```bash
cd /Users/xinyuepan/Desktop/intergration-backup_副本
bash test-cancel-booking.sh
```

**注意：** 这个脚本需要两个账户（Alice 和 Bob）才能完整测试。

---

## 📋 完整测试流程（手动）

### 步骤 1: 登录获取 Token

```bash
# 登录 Alice
TOKEN_ALICE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@cornell.edu","password":"alice1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Alice Token: $TOKEN_ALICE"
```

### 步骤 2: 查看 My Trips

```bash
# 获取所有行程
curl -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:3001/api/v1/carpooling/my-trips \
  | python3 -m json.tool > my_trips.json

# 查看结果
cat my_trips.json
```

**从结果中找到：**
- 如果你是 `passenger`，找到 `booking_id`
- 如果你是 `driver`，找到 `bookings` 数组中的 `id`

### 步骤 3: 取消预订

```bash
# 替换这里的 BOOKING_ID 为真实的 ID
BOOKING_ID="从上一步获取的真实ID"

# 乘客取消预订
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/v1/carpooling/bookings/$BOOKING_ID \
  | python3 -m json.tool
```

**预期响应：**
```json
{
  "success": true,
  "message": "Booking canceled"
}
```

**如果失败：**
```json
{
  "success": false,
  "error": {
    "code": "OPERATION_NOT_ALLOWED",
    "message": "Trip has started, cancellation is unavailable"
  }
}
```

### 步骤 4: 验证结果

```bash
# 再次查看 My Trips
curl -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:3001/api/v1/carpooling/my-trips \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for trip in data['data']['trips']:
    if trip.get('role') == 'passenger':
        booking_id = trip.get('booking_id')
        status = trip.get('booking_status')
        print(f'Booking {booking_id}: {status}')
"
```

**预期结果：** 状态应该是 `canceled_by_passenger`

---

## 🧪 完整测试场景

### 场景 A: 乘客取消自己的预订

**前提条件：**
- 用户有一个 `pending` 或 `confirmed` 的预订
- 行程还没有开始

**步骤：**
```bash
# 1. 登录
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 2. 找到预订 ID
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips | python3 -m json.tool

# 3. 取消预订（替换 BOOKING_ID）
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/bookings/BOOKING_ID | python3 -m json.tool
```

### 场景 B: 司机取消某个乘客的预订

**前提条件：**
- 用户是行程的司机
- 有乘客已预订
- 行程还没有开始

**步骤：**
```bash
# 1. 登录司机账户
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"DRIVER_EMAIL","password":"DRIVER_PASSWORD"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 2. 查看我的行程（作为司机）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips | python3 -m json.tool

# 3. 司机取消某个预订（替换 BOOKING_ID）
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/v1/carpooling/bookings/BOOKING_ID/cancel-by-driver | python3 -m json.tool
```

---

## 🔍 常见错误

### 错误 1: TOKEN_INVALID
```json
{"success":false,"error":{"code":"TOKEN_INVALID","message":"Invalid token"}}
```

**原因：** Token 未设置或已过期

**解决：** 重新登录获取新 token

### 错误 2: 404 Not Found
```json
{"success":false,"error":{"code":"RESOURCE_NOT_FOUND","message":"Booking not found"}}
```

**原因：** Booking ID 不存在或不属于你

**解决：** 检查 ID 是否正确

### 错误 3: 409 Conflict
```json
{"success":false,"error":{"code":"OPERATION_NOT_ALLOWED","message":"Trip has started, cancellation is unavailable"}}
```

**原因：** 行程已经开始，不能取消

**解决：** 只能取消未开始的行程

---

## 💡 快速提示

### 保存 Token 到变量
```bash
# 保存 token，后续可以重复使用
export MY_TOKEN="your-actual-token-here"

# 使用保存的 token
curl -H "Authorization: Bearer $MY_TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips
```

### 美化 JSON 输出
```bash
# 使用 python3 格式化
curl ... | python3 -m json.tool

# 或者使用 jq（如果已安装）
curl ... | jq '.'
```

### 查看完整请求
```bash
# 添加 -v 参数查看详细信息
curl -v -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips
```

---

## 🎯 下一步

如果手动测试太麻烦，可以：

1. **使用 Postman 或 Insomnia**
   - 导入 API 端点
   - 保存 Token 到环境变量
   - 可视化测试

2. **运行自动化测试脚本**
   ```bash
   bash test-cancel-booking.sh
   ```

3. **实现前端 UI**
   - 直接在前端界面中测试
   - 更直观的用户体验

---

## 📚 相关文档

- **完整 API 文档:** `MY_TRIPS_AND_RATING_SYSTEM.md`
- **所有可用端点:** 见文档中的 "API 文档" 部分
- **错误码说明:** 见文档中的 "错误处理" 部分

---

**记住：** 始终使用真实的 Token 和 ID，不要使用占位符！




