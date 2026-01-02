#!/bin/bash

# 取消功能测试脚本
# 用于诊断 500 错误

echo "========================================="
echo "🔍 取消功能诊断测试"
echo "========================================="
echo ""

# 配置
API_URL="http://localhost:3001/api/v1"

# 步骤 1: 登录获取 token
echo "📝 步骤 1: 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@cornell.edu",
    "password": "demo1234"
  }')

echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        token = data['data']['token']
        print(f'✅ 登录成功')
        print(f'Token: {token[:30]}...')
        # 保存 token 到临时文件
        with open('/tmp/test_token.txt', 'w') as f:
            f.write(token)
    else:
        print('❌ 登录失败')
        print(json.dumps(data, indent=2))
        sys.exit(1)
except Exception as e:
    print(f'❌ 解析失败: {e}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "登录失败，停止测试"
    exit 1
fi

TOKEN=$(cat /tmp/test_token.txt)
echo ""

# 步骤 2: 获取 My Trips
echo "📝 步骤 2: 获取 My Trips..."
MY_TRIPS_RESPONSE=$(curl -s -X GET "$API_URL/carpooling/my-trips" \
  -H "Authorization: Bearer $TOKEN")

echo "$MY_TRIPS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        trips = data['data']['trips']
        print(f'✅ 获取成功，共 {len(trips)} 个行程')
        print()
        
        passenger_trips = [t for t in trips if t.get('role') == 'passenger']
        driver_trips = [t for t in trips if t.get('role') == 'driver']
        
        print(f'乘客行程: {len(passenger_trips)} 个')
        print(f'司机行程: {len(driver_trips)} 个')
        print()
        
        # 显示详细信息
        for i, trip in enumerate(trips[:3], 1):
            print(f'行程 {i}:')
            print(f'  ID: {trip.get(\"id\")}')
            print(f'  角色: {trip.get(\"role\")}')
            print(f'  标题: {trip.get(\"title\")}')
            if trip.get('role') == 'passenger':
                print(f'  Booking ID: {trip.get(\"booking_id\")}')
                print(f'  Booking Status: {trip.get(\"booking_status\")}')
            else:
                print(f'  Trip Status: {trip.get(\"status\")}')
            print()
        
        # 保存一个可取消的行程 ID
        for trip in trips:
            if trip.get('role') == 'passenger' and trip.get('booking_status') in ['pending', 'confirmed']:
                with open('/tmp/test_booking_id.txt', 'w') as f:
                    f.write(trip.get('booking_id', ''))
                print(f'💾 找到可取消的乘客预订: {trip.get(\"booking_id\")}')
                break
            elif trip.get('role') == 'driver' and trip.get('status') in ['active', 'full']:
                with open('/tmp/test_ride_id.txt', 'w') as f:
                    f.write(trip.get('id', ''))
                print(f'💾 找到可取消的司机行程: {trip.get(\"id\")}')
                break
    else:
        print('❌ 获取失败')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'❌ 解析失败: {e}')
    import traceback
    traceback.print_exc()
" 2>&1

echo ""
echo "========================================="
echo "🧪 测试取消功能"
echo "========================================="
echo ""

# 测试乘客取消
if [ -f /tmp/test_booking_id.txt ]; then
    BOOKING_ID=$(cat /tmp/test_booking_id.txt)
    if [ ! -z "$BOOKING_ID" ]; then
        echo "📝 测试 3A: 乘客取消预订..."
        echo "Booking ID: $BOOKING_ID"
        
        CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/carpooling/bookings/$BOOKING_ID" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json")
        
        echo "$CANCEL_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 乘客取消成功')
        print(json.dumps(data, indent=2))
    else:
        print('❌ 乘客取消失败')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'❌ 解析响应失败: {e}')
    print('原始响应:')
    for line in sys.stdin:
        print(line)
"
        echo ""
    fi
fi

# 测试司机取消
if [ -f /tmp/test_ride_id.txt ]; then
    RIDE_ID=$(cat /tmp/test_ride_id.txt)
    if [ ! -z "$RIDE_ID" ]; then
        echo "📝 测试 3B: 司机取消行程..."
        echo "Ride ID: $RIDE_ID"
        
        # 注意：这会实际取消行程！
        read -p "⚠️  这将取消一个实际的行程。是否继续？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/carpooling/rides/$RIDE_ID" \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json")
            
            echo "$CANCEL_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ 司机取消成功')
        print(json.dumps(data, indent=2))
    else:
        print('❌ 司机取消失败')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'❌ 解析响应失败: {e}')
    print('原始响应:')
    for line in sys.stdin:
        print(line)
"
        else
            echo "跳过司机取消测试"
        fi
        echo ""
    fi
fi

echo "========================================="
echo "🎯 测试完成"
echo "========================================="
echo ""
echo "💡 提示："
echo "1. 如果看到 500 错误，请检查后端日志：tail -50 /tmp/backend.log"
echo "2. 如果看到 401 错误，token 可能过期，重新运行此脚本"
echo "3. 如果没有可取消的行程，请先创建一些行程和预订"
echo ""







