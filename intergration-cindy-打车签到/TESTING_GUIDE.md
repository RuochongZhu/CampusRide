# 🧪 完整测试指南

## 系统状态

- ✅ 后端服务：运行中 (http://localhost:3001)
- ✅ 前端服务：运行中 (http://localhost:3000)
- ✅ 数据库：已连接
- ✅ 所有功能：已实现

---

## 🔑 测试账户

### 账户 1: Alice Johnson（司机）
```
邮箱: alice@cornell.edu
密码: alice1234
角色: 司机
特点: 已发布多个行程
```

### 账户 2: Demo User（乘客）
```
邮箱: demo@cornell.edu
密码: demo1234
角色: 乘客
特点: 用于测试预订
```

### 账户 3-6: 测试账户（可选）
```
邮箱: test2@cornell.edu, test3@cornell.edu, test4@cornell.edu
密码: test1234
角色: 乘客
特点: 用于测试多人预订和满员
```

---

## 📋 当前可用行程

### 1. Cornell to Boston
- **司机**: Alice Johnson
- **座位**: 0/4 (剩余 4)
- **价格**: $40/座
- **状态**: Active ✅

### 2. Cornell to NYC Airport（新创建）
- **司机**: Alice Johnson
- **座位**: 0/3 (剩余 3)
- **价格**: $35/座
- **状态**: Active ✅

### 3. Cornell to NYC（已满）
- **状态**: Full ❌
- **说明**: 此行程已满员，不会出现在列表中

---

## 🧪 测试场景

### 场景 1: 基础预订流程

**测试步骤**：

1. **乘客预订行程**
   ```
   - 访问: http://localhost:3000
   - 登录: demo@cornell.edu / demo1234
   - 进入 Rideshare/Carpooling 页面
   - 切换到 "Passenger" 模式
   - 浏览可用行程
   - 选择 "Cornell to NYC Airport"
   - 点击 "Book" 预订 1 个座位
   ```

2. **预期结果**：
   - ✅ 显示成功消息："Your booking request has been sent to the driver for confirmation."
   - ✅ "My Trips" 中显示预订，状态为 `pending`

3. **司机查看通知**
   ```
   - 登出 Demo
   - 登录: alice@cornell.edu / alice1234
   - 切换到 "Driver" 模式
   - 点击右上角通知铃铛 🔔
   ```

4. **预期结果**：
   - ✅ 看到 1 个新通知
   - ✅ 通知内容："Demo User requested to join your trip: Cornell to NYC Airport"
   - ✅ 显示乘客信息和行程详情
   - ✅ 有 "Accept" 和 "Reject" 按钮

5. **司机接受预订**
   ```
   - 点击 "Accept"
   ```

6. **预期结果**：
   - ✅ 显示成功消息："Booking request accepted successfully"
   - ✅ "My Rides" 中该行程显示 1/3 座位已订
   - ✅ Demo 收到确认通知

7. **乘客查看状态**
   ```
   - 登出 Alice
   - 登录: demo@cornell.edu / demo1234
   - 查看 "My Trips"
   ```

8. **预期结果**：
   - ✅ 预订状态变为 `confirmed`
   - ✅ 显示绿色标签或确认图标

---

### 场景 2: 司机拒绝预订

**测试步骤**：

1. **Test2 创建预订**
   ```
   - 登录: test2@cornell.edu / test1234
   - 预订 "Cornell to Boston" 行程
   ```

2. **Alice 拒绝预订**
   ```
   - 登录: alice@cornell.edu / alice1234
   - 查看通知
   - 点击 "Reject"
   ```

3. **预期结果**：
   - ✅ 预订被取消
   - ✅ Test2 收到拒绝通知："Your booking request has been declined by the driver."

---

### 场景 3: 测试座位管理和满员

**测试步骤**：

1. **创建 3 个预订**（Cornell to NYC Airport 有 3 个座位）
   ```
   - Demo 预订 1 座
   - Test2 预订 1 座
   - Test3 预订 1 座
   ```

2. **Alice 依次接受**
   ```
   - 接受 Demo 的预订 → 座位: 1/3
   - 接受 Test2 的预订 → 座位: 2/3
   - 接受 Test3 的预订 → 座位: 3/3 → 状态变为 FULL
   ```

3. **预期结果**：
   - ✅ 座位数准确更新
   - ✅ 第 3 个接受后，行程状态变为 `full`
   - ✅ 行程从 Available Trips 列表消失

4. **Test4 尝试预订**
   ```
   - 登录: test4@cornell.edu / test1234
   - 尝试预订 "Cornell to NYC Airport"
   ```

5. **预期结果**：
   - ❌ 无法预订（行程不在列表中或显示 "已满"）

---

### 场景 4: 司机不能预订自己的行程

**测试步骤**：

1. **Alice 尝试预订自己的行程**
   ```
   - 登录: alice@cornell.edu / alice1234
   - 切换到 "Passenger" 模式
   - 尝试预订 "Cornell to Boston"（自己发布的）
   ```

2. **预期结果**：
   - ❌ 显示错误："Cannot book your own ride"

---

### 场景 5: 重复预订拦截

**测试步骤**：

1. **Demo 已预订过的行程再次预订**
   ```
   - 登录: demo@cornell.edu / demo1234
   - 尝试再次预订已预订过的行程
   ```

2. **预期结果**：
   - ❌ 显示错误："You have already booked this ride" 或 "You already have a pending booking request"

---

## 🎯 关键测试点检查清单

### 预订功能
- [ ] 乘客可以浏览可用行程
- [ ] 乘客可以预订行程
- [ ] 预订状态初始为 `pending`
- [ ] 预订成功后显示正确的提示消息

### 通知功能
- [ ] 司机收到预订请求通知
- [ ] 通知显示乘客信息和行程详情
- [ ] 未读通知数量正确显示
- [ ] 通知铃铛有红色徽章

### 司机接受/拒绝
- [ ] 司机可以接受预订
- [ ] 接受后预订状态变为 `confirmed`
- [ ] 乘客收到确认通知
- [ ] 司机可以拒绝预订
- [ ] 拒绝后预订被取消
- [ ] 乘客收到拒绝通知

### 座位管理
- [ ] 座位数实时更新
- [ ] 只统计 `confirmed` 状态的座位
- [ ] `pending` 预订不占实际座位
- [ ] 满员后行程状态变为 `full`
- [ ] `full` 行程从列表中移除
- [ ] 无法预订已满行程

### 业务规则
- [ ] 司机不能预订自己的行程
- [ ] 不能重复预订同一行程
- [ ] 座位数不能超过总座位
- [ ] 并发预订不会导致超卖

---

## 🔍 调试技巧

### 查看后端日志
```bash
# 查看后端控制台输出
# 应该显示：
# - 预订创建日志
# - 通知创建日志
# - 座位更新日志
# - "Ride XXX is now FULL" 消息（满员时）
```

### 使用浏览器开发者工具
```
F12 → Network 标签
- 查看 API 请求和响应
- 检查错误消息
- 验证返回的数据结构
```

### 数据库直接查询（如果需要）
```javascript
// 在 Supabase Dashboard 中
SELECT * FROM ride_bookings WHERE ride_id = 'xxx';
SELECT * FROM notifications WHERE driver_id = 'xxx';
SELECT * FROM rides WHERE status = 'full';
```

---

## 📊 预期 API 响应示例

### 创建预订成功
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "...",
      "status": "pending",
      "seats_booked": 1,
      "total_price": 35
    }
  },
  "message": "Your booking request has been sent to the driver for confirmation."
}
```

### 获取司机通知
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "...",
        "type": "booking_request",
        "status": "pending",
        "message": "Demo User requested to join your trip: Cornell to NYC Airport",
        "passenger": {
          "first_name": "Demo",
          "last_name": "User"
        },
        "trip": {
          "title": "Cornell to NYC Airport"
        }
      }
    ],
    "pagination": {
      "unread_count": 1
    }
  }
}
```

### 接受预订成功
```json
{
  "success": true,
  "data": {
    "ride_status": "active",  // or "full"
    "seats_info": {
      "booked": 1,
      "total": 3,
      "remaining": 2
    }
  },
  "message": "Booking request accepted successfully"
}
```

---

## 🆘 常见问题

### Q: 看不到通知？
A: 
- 确保以司机身份（Alice）登录
- 刷新页面
- 检查通知 API 调用是否成功

### Q: 预订后状态不更新？
A:
- 确保司机接受了预订
- 刷新 "My Trips" 页面
- 检查浏览器控制台是否有错误

### Q: 座位数不对？
A:
- 只有 `confirmed` 状态的预订才计入座位
- `pending` 预订不占座
- 刷新页面查看最新状态

### Q: 无法预订？
A:
- 检查是否是自己发布的行程
- 检查是否已预订过
- 检查行程是否已满
- 查看错误消息

---

## 🎉 测试完成标准

当以下所有测试通过时，系统即可投入使用：

- ✅ 所有场景测试通过
- ✅ 所有关键测试点检查完成
- ✅ 没有控制台错误
- ✅ 座位管理正确
- ✅ 通知系统工作正常
- ✅ 用户体验流畅

---

**祝测试顺利！** 🚀

如有问题，请查看：
- `BOOKING_NOTIFICATION_SYSTEM.md` - 通知系统文档
- `SEAT_MANAGEMENT_SYSTEM.md` - 座位管理文档







