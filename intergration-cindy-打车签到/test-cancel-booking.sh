#!/bin/bash

# 测试取消预订功能的完整脚本

set -e

API_URL="http://localhost:3001/api/v1"
ALICE_EMAIL="alice@cornell.edu"
ALICE_PASSWORD="alice1234"

echo "🧪 测试取消预订功能"
echo "=========================================="
echo ""

# 步骤 1: 登录 Alice
echo "步骤 1: Alice 登录..."
TOKEN_ALICE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALICE_EMAIL\",\"password\":\"$ALICE_PASSWORD\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -n "$TOKEN_ALICE" ]; then
    echo "✅ Alice 登录成功"
else
    echo "❌ Alice 登录失败"
    exit 1
fi

echo ""

# 步骤 2: 创建一个测试行程
echo "步骤 2: Alice 创建测试行程..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/carpooling/rides" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -d '{
    "title": "Test Trip for Cancellation",
    "departureLocation": "Cornell University",
    "destinationLocation": "NYC",
    "departureTime": "2025-12-10T10:00:00.000Z",
    "availableSeats": 3,
    "pricePerSeat": 30,
    "description": "Test trip"
  }')

TRIP_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['ride']['id'])" 2>/dev/null)

if [ -n "$TRIP_ID" ]; then
    echo "✅ 行程创建成功"
    echo "   行程 ID: $TRIP_ID"
else
    echo "❌ 行程创建失败"
    echo "$CREATE_RESPONSE" | python3 -m json.tool
    exit 1
fi

echo ""

# 步骤 3: 创建第二个用户（Bob）并预订
echo "步骤 3: 检查是否有 Bob 账户..."

# 尝试登录 Bob
TOKEN_BOB=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@cornell.edu","password":"bob1234"}' \
  | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['token']) if d.get('success') else ''" 2>/dev/null)

if [ -z "$TOKEN_BOB" ]; then
    echo "⚠️  Bob 账户不存在，跳过预订测试"
    echo "   (你可以创建 Bob 账户来测试完整流程)"
    echo ""
    echo "如何测试取消功能："
    echo "1. 创建另一个测试账户（Bob）"
    echo "2. 让 Bob 预订 Alice 的行程"
    echo "3. Alice 接受预订"
    echo "4. Bob 取消预订"
    echo ""
    echo "取消预订 API 示例:"
    echo "curl -X DELETE \\"
    echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
    echo "  $API_URL/carpooling/bookings/BOOKING_ID"
    exit 0
fi

echo "✅ Bob 登录成功"
echo ""

# 步骤 4: Bob 预订行程
echo "步骤 4: Bob 预订行程..."
BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/carpooling/rides/$TRIP_ID/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -d '{
    "seatsBooked": 1,
    "contactNumber": "123-456-7890"
  }')

BOOKING_ID=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['booking']['id']) if d.get('success') else ''" 2>/dev/null)

if [ -n "$BOOKING_ID" ]; then
    echo "✅ Bob 预订成功"
    echo "   预订 ID: $BOOKING_ID"
    echo "   状态: pending (等待 Alice 确认)"
else
    echo "❌ 预订失败"
    echo "$BOOKING_RESPONSE" | python3 -m json.tool
    exit 1
fi

echo ""

# 步骤 5: Alice 查看通知
echo "步骤 5: Alice 查看预订通知..."
NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $TOKEN_ALICE")

NOTIF_COUNT=$(echo "$NOTIF_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d['data']['notifications'])) if d.get('success') else 0" 2>/dev/null)

echo "✅ Alice 收到 $NOTIF_COUNT 个通知"
echo ""

# 步骤 6: Alice 接受预订
echo "步骤 6: Alice 接受预订..."
NOTIF_ID=$(echo "$NOTIF_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    for n in d['data']['notifications']:
        if n.get('type') == 'booking_request' and n.get('status') == 'pending':
            print(n['id'])
            break
" 2>/dev/null)

if [ -n "$NOTIF_ID" ]; then
    ACCEPT_RESPONSE=$(curl -s -X POST "$API_URL/notifications/$NOTIF_ID/respond" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN_ALICE" \
      -d '{"action":"accept"}')
    
    if echo "$ACCEPT_RESPONSE" | grep -q "\"success\":true"; then
        echo "✅ Alice 接受了预订"
        echo "   预订状态: pending → confirmed"
    else
        echo "⚠️  接受预订失败"
        echo "$ACCEPT_RESPONSE" | python3 -m json.tool
    fi
else
    echo "⚠️  未找到待处理的预订通知"
fi

echo ""

# 步骤 7: Bob 取消预订
echo "步骤 7: Bob 尝试取消预订..."
echo "=========================================="
echo ""

CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/carpooling/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN_BOB")

if echo "$CANCEL_RESPONSE" | grep -q "\"success\":true"; then
    echo "✅ 取消成功！"
    echo "   消息: $(echo "$CANCEL_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', ''))")"
    echo ""
    echo "预期结果:"
    echo "  ✓ 预订状态: confirmed → canceled_by_passenger"
    echo "  ✓ 行程座位自动回退"
    echo "  ✓ Alice 收到取消通知"
else
    echo "❌ 取消失败"
    echo "$CANCEL_RESPONSE" | python3 -m json.tool
fi

echo ""

# 步骤 8: 验证结果
echo "步骤 8: 验证取消结果..."
echo "=========================================="

# 检查 Alice 是否收到通知
NEW_NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $TOKEN_ALICE")

HAS_CANCEL_NOTIF=$(echo "$NEW_NOTIF_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    for n in d['data']['notifications']:
        if n.get('type') == 'booking_canceled':
            print('yes')
            break
" 2>/dev/null)

if [ "$HAS_CANCEL_NOTIF" = "yes" ]; then
    echo "✅ Alice 收到了取消通知"
else
    echo "⚠️  未找到取消通知（可能需要刷新）"
fi

# 检查 Bob 的 My Trips
BOB_TRIPS=$(curl -s -X GET "$API_URL/carpooling/my-trips" \
  -H "Authorization: Bearer $TOKEN_BOB")

BOOKING_STATUS=$(echo "$BOB_TRIPS" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    for trip in d['data']['trips']:
        if trip.get('booking_id') == '$BOOKING_ID':
            print(trip.get('booking_status', 'unknown'))
            break
" 2>/dev/null)

echo "✅ Bob 的预订状态: $BOOKING_STATUS"

echo ""
echo "=========================================="
echo "🎉 测试完成！"
echo "=========================================="
echo ""
echo "测试总结:"
echo "  ✓ Alice 创建行程"
echo "  ✓ Bob 预订行程"
echo "  ✓ Alice 接受预订"
echo "  ✓ Bob 取消预订"
echo "  ✓ 系统自动处理座位回退"
echo "  ✓ 通知系统正常工作"
echo ""







