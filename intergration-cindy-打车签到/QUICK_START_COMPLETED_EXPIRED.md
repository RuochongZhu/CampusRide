# 🚀 快速开始：Completed vs Expired 测试

## ⚡ 3 步快速测试

### 步骤 1: 运行 SQL（⚠️ 必须）

打开 Supabase Dashboard → SQL Editor → 粘贴并运行：

```sql
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE rides
ADD CONSTRAINT rides_status_check
CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));
```

**为什么必须：** 不运行的话数据库会拒绝 `'expired'` 状态！

---

### 步骤 2: 强制刷新浏览器

```
Mac: Command + Shift + R
Windows: Ctrl + Shift + R
```

---

### 步骤 3: 运行测试

```bash
bash test-completed-vs-expired.sh
```

**这个脚本会：**
1. 创建 2 个测试行程（1 分钟后过期）
2. 第 1 个有预订 → 应该变成 `completed` 🔵
3. 第 2 个无预订 → 应该变成 `expired` ⚪
4. 等待 1 分钟
5. 自动验证结果

---

## 📊 预期结果

### 测试脚本输出

```
✅ 测试 1 通过: 有预订的行程 → 'completed' 🔵
   行程: Test WITH Booking → Should be COMPLETED
   状态: completed
   预订数: 1

✅ 测试 2 通过: 无预订的行程 → 'expired' ⚪
   行程: Test WITHOUT Booking → Should be EXPIRED
   状态: expired
   预订数: 0
```

### 浏览器 My Trips

刷新后应该看到：

```
┌────────────────────────────────────────────┐
│ Test WITH Booking                         │
│ 状态: 已完成 🔵                           │
│ 1 booking                                 │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Test WITHOUT Booking                      │
│ 状态: 已过期 ⚪                           │
│ 0 bookings                                │
└────────────────────────────────────────────┘
```

---

## 🎯 核心逻辑

```
行程时间到达后:

有 confirmed bookings?
  ├── Yes → status = 'completed' 🔵 已完成
  └── No  → status = 'expired'   ⚪ 已过期
```

---

## 📝 手动测试

如果不想运行脚本，可以手动测试：

### 测试 Completed

1. 登录 Alice 账户
2. 发布行程（5 分钟后）
3. 登录 Bob 账户
4. 预订行程
5. 登录 Alice 账户
6. 接受预订
7. 等待 5 分钟
8. 刷新 My Trips
9. ✅ 应该显示"已完成"🔵

### 测试 Expired

1. 登录 Alice 账户
2. 发布行程（5 分钟后）
3. **不要预订**
4. 等待 5 分钟
5. 刷新 My Trips
6. ✅ 应该显示"已过期"⚪

---

## ⚠️ 常见问题

### Q: 状态没有自动更新？

**A:** 刷新页面！状态更新在以下时候触发：
- 刷新 Available Rides
- 刷新 My Trips
- 重新加载页面

### Q: 数据库报错 "value out of range"？

**A:** 你没有运行步骤 1 的 SQL！
数据库约束还不包含 `'expired'` 状态。

### Q: pending 的预订算不算？

**A:** 不算！只有 `confirmed` 的预订才算。

```
pending booking → expired ⚪
confirmed booking → completed 🔵
```

---

## 📚 完整文档

详细说明请看：**`COMPLETED_VS_EXPIRED.md`**

---

**就这么简单！现在开始测试吧！** 🎉




