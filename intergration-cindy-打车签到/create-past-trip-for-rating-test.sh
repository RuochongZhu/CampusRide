#!/bin/bash

# 创建过去时间的测试行程用于评分测试
# 这个脚本会：
# 1. 创建一个过去时间的行程（司机 Alice）
# 2. 乘客 Demo 预订
# 3. 司机接受预订
# 4. 然后就可以测试评分功能了

echo "========================================="
echo "🚗 创建评分测试数据"
echo "========================================="
echo ""

API_URL="http://localhost:3001/api/v1"

# Step 1: 司机登录
echo "📝 Step 1: 司机登录 (Alice)..."
DRIVER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@cornell.edu",
    "password": "alice1234"
  }')

DRIVER_TOKEN=$(echo "$DRIVER_LOGIN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print(data['data']['token'])
    else:
        print('ERROR', file=sys.stderr)
        sys.exit(1)
except:
    print('ERROR', file=sys.stderr)
    sys.exit(1)
")

if [ "$DRIVER_TOKEN" == "ERROR" ] || [ -z "$DRIVER_TOKEN" ]; then
    echo "❌ 司机登录失败"
    exit 1
fi

echo "✅ 司机登录成功"
echo ""

# Step 2: 创建过去时间的行程
echo "📝 Step 2: 创建测试行程（1小时前开始）..."

# 计算 1 小时前的时间
PAST_TIME=$(python3 -c "
from datetime import datetime, timedelta
import json
past = datetime.now() - timedelta(hours=1)
print(past.strftime('%Y-%m-%dT%H:%M:%S.000Z'))
")

echo "行程开始时间: $PAST_TIME"

CREATE_RIDE=$(curl -s -X POST "$API_URL/carpooling/rides" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Rating Test Trip - Cornell to NYC\",
    \"description\": \"This is a test trip for rating feature\",
    \"departureLocation\": \"Cornell University, Ithaca NY\",
    \"destinationLocation\": \"New York City, NY\",
    \"departureTime\": \"$PAST_TIME\",
    \"availableSeats\": 3,
    \"pricePerSeat\": 35,
    \"vehicleInfo\": \"Tesla Model 3\",
    \"contactInfo\": \"alice@cornell.edu\"
  }")

RIDE_ID=$(echo "$CREATE_RIDE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        ride_id = data['data']['ride']['id']
        print(ride_id)
        print(f'✅ 行程创建成功', file=sys.stderr)
        print(f'   ID: {ride_id}', file=sys.stderr)
    else:
        print('ERROR', file=sys.stderr)
        error = data.get('error', {})
        print(f'   错误: {error.get(\"message\", \"Unknown\")}', file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print('ERROR', file=sys.stderr)
    print(f'   异常: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)

if echo "$RIDE_ID" | grep -q "ERROR" || [ -z "$RIDE_ID" ]; then
    echo "❌ 行程创建失败"
    exit 1
fi

echo ""

# Step 3: 乘客登录
echo "📝 Step 3: 乘客登录 (Demo)..."
PASSENGER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@cornell.edu",
    "password": "demo1234"
  }')

PASSENGER_TOKEN=$(echo "$PASSENGER_LOGIN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print(data['data']['token'])
    else:
        sys.exit(1)
except:
    sys.exit(1)
")

if [ -z "$PASSENGER_TOKEN" ]; then
    echo "❌ 乘客登录失败"
    exit 1
fi

echo "✅ 乘客登录成功"
echo ""

# Step 4: 乘客预订
echo "📝 Step 4: 乘客预订行程..."
BOOK_RIDE=$(curl -s -X POST "$API_URL/carpooling/rides/$RIDE_ID/book" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatsBooked": 1,
    "contactNumber": "607-123-4567",
    "pickupLocation": "Cornell University",
    "specialRequests": "Please wait at the main gate"
  }')

BOOKING_ID=$(echo "$BOOK_RIDE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        booking_id = data['data']['booking']['id']
        print(booking_id)
        print(f'✅ 预订成功', file=sys.stderr)
        print(f'   Booking ID: {booking_id}', file=sys.stderr)
    else:
        print('ERROR', file=sys.stderr)
        error = data.get('error', {})
        print(f'   错误: {error.get(\"message\", \"Unknown\")}', file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print('ERROR', file=sys.stderr)
    print(f'   异常: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)

if echo "$BOOKING_ID" | grep -q "ERROR" || [ -z "$BOOKING_ID" ]; then
    echo "❌ 预订失败"
    exit 1
fi

echo ""

# Step 5: 获取通知ID（司机收到的预订请求）
echo "📝 Step 5: 获取预订通知..."
sleep 1

NOTIFICATIONS=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

NOTIFICATION_ID=$(echo "$NOTIFICATIONS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        notifications = data['data']['notifications']
        # 找到最新的 booking_request 通知
        for notif in notifications:
            if notif['type'] == 'booking_request' and notif['booking_id'] == '$BOOKING_ID':
                print(notif['id'])
                print(f'✅ 找到预订通知', file=sys.stderr)
                break
except:
    pass
" 2>&1)

echo ""

# Step 6: 司机接受预订
if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "ERROR" ]; then
    echo "📝 Step 6: 司机接受预订..."
    ACCEPT_BOOKING=$(curl -s -X POST "$API_URL/notifications/$NOTIFICATION_ID/respond" \
      -H "Authorization: Bearer $DRIVER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "accept"
      }')
    
    echo "$ACCEPT_BOOKING" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 司机已接受预订')
    else:
        print('❌ 接受预订失败')
        error = data.get('error', {})
        print(f'   错误: {error.get(\"message\", \"Unknown\")}')
except:
    print('❌ 解析响应失败')
"
else
    echo "⚠️  无法自动接受预订，请手动操作"
fi

echo ""
echo "========================================="
echo "🎉 测试数据创建完成！"
echo "========================================="
echo ""
echo "📋 测试数据摘要："
echo ""
echo "  🚗 行程信息："
echo "     ID: $RIDE_ID"
echo "     司机: Alice Johnson (alice@cornell.edu)"
echo "     路线: Cornell → NYC"
echo "     开始时间: $PAST_TIME （已开始）"
echo ""
echo "  🎫 预订信息："
echo "     Booking ID: $BOOKING_ID"
echo "     乘客: Demo User (demo@cornell.edu)"
echo "     状态: confirmed"
echo ""
echo "========================================="
echo "🧪 现在可以测试评分功能了！"
echo "========================================="
echo ""
echo "测试步骤："
echo ""
echo "1️⃣  测试乘客评分司机："
echo "   - 登录: demo@cornell.edu / demo1234"
echo "   - Carpooling → My Trips"
echo "   - 点击 'Rating Test Trip - Cornell to NYC'"
echo "   - 应该看到黄色 [Rate Driver] 按钮"
echo "   - 点击评分！⭐⭐⭐⭐⭐"
echo ""
echo "2️⃣  测试司机评分乘客："
echo "   - 登录: alice@cornell.edu / alice1234"
echo "   - Carpooling → My Trips"
echo "   - 点击 'Rating Test Trip - Cornell to NYC'"
echo "   - 在 'Rate Passengers' 部分"
echo "   - 点击 Demo User 旁边的 [Rate] 按钮"
echo "   - 点击评分！⭐⭐⭐⭐⭐"
echo ""
echo "3️⃣  验证防止重复评分："
echo "   - 已评分后，按钮应该变为 [View Rating]"
echo "   - 显示绿色'已评分'状态 ✅"
echo ""
echo "========================================="
echo ""
echo "💡 提示："
echo "   - 如果看不到评分按钮，请刷新浏览器 (Cmd/Ctrl + Shift + R)"
echo "   - 行程时间设置为 1 小时前，确保已开始"
echo "   - 预订状态为 confirmed，满足评分条件"
echo ""
echo "祝测试顺利！🚀"
echo ""




