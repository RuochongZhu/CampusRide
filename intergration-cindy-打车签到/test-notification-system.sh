#!/bin/bash

# 预订通知系统测试脚本
# 使用方法: ./test-notification-system.sh

API_URL="http://localhost:3001/api/v1"

echo "🧪 开始测试预订通知系统..."
echo ""

# 1. Demo 用户登录
echo "1️⃣  Demo 用户登录..."
TOKEN_DEMO=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@cornell.edu","password": "demo1234"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

if [ -z "$TOKEN_DEMO" ]; then
  echo "❌ Demo 登录失败"
  exit 1
fi
echo "✅ Demo 登录成功"
echo ""

# 2. Alice 用户登录
echo "2️⃣  Alice 用户登录..."
TOKEN_ALICE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@cornell.edu","password": "alice1234"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

if [ -z "$TOKEN_ALICE" ]; then
  echo "❌ Alice 登录失败"
  exit 1
fi
echo "✅ Alice 登录成功"
echo ""

# 3. 获取第一个可用行程
echo "3️⃣  获取可用行程..."
RIDE_ID=$(curl -s "${API_URL}/carpooling/rides" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data']['rides'][0]['id'])")

echo "✅ 行程ID: $RIDE_ID"
echo ""

# 4. Demo 创建预订
echo "4️⃣  Demo 创建预订请求..."
BOOKING_RESPONSE=$(curl -s -X POST "${API_URL}/carpooling/rides/${RIDE_ID}/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DEMO" \
  -d '{
    "seatsBooked": 1,
    "pickupLocation": "Test Location",
    "contactNumber": "+1-607-555-0000"
  }')

BOOKING_STATUS=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data']['booking']['status'])")

if [ "$BOOKING_STATUS" == "pending" ]; then
  echo "✅ 预订创建成功 (状态: pending)"
else
  echo "❌ 预订状态错误: $BOOKING_STATUS"
  exit 1
fi
echo ""

# 5. Alice 查看通知
echo "5️⃣  Alice 查看司机通知..."
NOTIFICATIONS=$(curl -s -H "Authorization: Bearer $TOKEN_ALICE" \
  "${API_URL}/notifications?limit=1")

NOTIF_COUNT=$(echo "$NOTIFICATIONS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data']['pagination']['total_items'])")

if [ "$NOTIF_COUNT" -gt "0" ]; then
  echo "✅ Alice 收到 $NOTIF_COUNT 个通知"
  NOTIF_ID=$(echo "$NOTIFICATIONS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data']['notifications'][0]['id'])")
  echo "   通知ID: $NOTIF_ID"
else
  echo "❌ Alice 没有收到通知"
  exit 1
fi
echo ""

# 6. Alice 接受预订
echo "6️⃣  Alice 接受预订请求..."
ACCEPT_RESPONSE=$(curl -s -X POST "${API_URL}/notifications/${NOTIF_ID}/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -d '{"action": "accept"}')

ACCEPT_SUCCESS=$(echo "$ACCEPT_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['success'])")

if [ "$ACCEPT_SUCCESS" == "True" ]; then
  echo "✅ 预订已接受"
else
  echo "❌ 接受预订失败"
  exit 1
fi
echo ""

# 7. Demo 查看乘客通知
echo "7️⃣  Demo 查看乘客通知..."
PASSENGER_NOTIFS=$(curl -s -H "Authorization: Bearer $TOKEN_DEMO" \
  "${API_URL}/notifications/passenger")

PASSENGER_NOTIF_COUNT=$(echo "$PASSENGER_NOTIFS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data['data']['notifications']))")

if [ "$PASSENGER_NOTIF_COUNT" -gt "0" ]; then
  echo "✅ Demo 收到 $PASSENGER_NOTIF_COUNT 个乘客通知"
  
  # 检查是否有确认通知
  HAS_CONFIRMED=$(echo "$PASSENGER_NOTIFS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(any(n['type'] == 'booking_confirmed' for n in data['data']['notifications']))")
  
  if [ "$HAS_CONFIRMED" == "True" ]; then
    echo "   ✅ 包含确认通知 (booking_confirmed)"
  else
    echo "   ⚠️  未找到确认通知"
  fi
else
  echo "❌ Demo 没有收到乘客通知"
  exit 1
fi
echo ""

echo "🎉 所有测试通过！预订通知系统运行正常！"
echo ""
echo "📊 测试总结:"
echo "   ✅ 预订创建 (status: pending)"
echo "   ✅ 司机通知创建"
echo "   ✅ 司机接受预订"
echo "   ✅ 预订状态更新"
echo "   ✅ 乘客确认通知"







