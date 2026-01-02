#!/bin/bash

echo "🧪 测试 Completed vs Expired 状态"
echo "=================================="
echo ""

cd /Users/xinyuepan/Desktop/intergration-backup_副本

python3 << 'EOF'
import requests
from datetime import datetime, timedelta
import time

API_URL = "http://localhost:3001/api/v1"

print("📝 步骤 1: 登录账户")
print()

# 登录 Alice
alice_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "alice@cornell.edu",
    "password": "alice1234"
})

if not alice_login.json().get('success'):
    print("❌ Alice 登录失败")
    exit(1)

alice_token = alice_login.json()['data']['token']
print("✅ Alice 登录成功")

# 登录 Bob
bob_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "bob@cornell.edu",
    "password": "bob1234"
})

if not bob_login.json().get('success'):
    print("❌ Bob 登录失败")
    exit(1)

bob_token = bob_login.json()['data']['token']
print("✅ Bob 登录成功")
print()

# ==========================================
# 测试 1: 创建有预订的行程
# ==========================================

print("=" * 60)
print("📝 测试 1: 创建有预订的行程")
print("=" * 60)
print()

future_time_1 = (datetime.now() + timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S')

print(f"🚗 Alice 发布行程（1 分钟后）")
print(f"   时间: {future_time_1}")

ride1 = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "title": "Test WITH Booking → Should be COMPLETED",
        "departureLocation": "Cornell University",
        "destinationLocation": "New York City",
        "departureTime": future_time_1,
        "availableSeats": 3,
        "pricePerSeat": 35,
        "description": "This ride will have a confirmed booking"
    }
)

if not ride1.json().get('success'):
    print(f"❌ 行程创建失败: {ride1.json()}")
    exit(1)

ride1_id = ride1.json()['data']['ride']['id']
print(f"✅ 行程创建成功 (ID: {ride1_id[:8]}...)")
print()

print("👤 Bob 发送预订请求")
booking = requests.post(
    f"{API_URL}/carpooling/rides/{ride1_id}/book",
    headers={"Authorization": f"Bearer {bob_token}"},
    json={"seatsBooked": 1}
)

if not booking.json().get('success'):
    print(f"❌ 预订失败: {booking.json()}")
    exit(1)

print("✅ Bob 预订成功")
print()

print("🔔 Alice 查看通知")
notifications = requests.get(
    f"{API_URL}/notifications",
    headers={"Authorization": f"Bearer {alice_token}"}
)

if not notifications.json().get('success'):
    print(f"❌ 获取通知失败")
    exit(1)

notifs = notifications.json()['data']['notifications']
target_notif = None
for n in notifs:
    if n.get('trip_id') == ride1_id and n.get('type') == 'booking_request':
        target_notif = n
        break

if not target_notif:
    print("❌ 未找到预订通知")
    exit(1)

print(f"✅ 找到预订通知 (ID: {target_notif['id'][:8]}...)")
print()

print("✔️  Alice 接受预订")
accept = requests.post(
    f"{API_URL}/notifications/{target_notif['id']}/respond",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={"action": "accept"}
)

if not accept.json().get('success'):
    print(f"❌ 接受失败: {accept.json()}")
    exit(1)

print("✅ Alice 接受预订成功")
print()
print("🎯 预期结果: 1 分钟后状态应该是 'completed' 🔵")
print()

# ==========================================
# 测试 2: 创建无预订的行程
# ==========================================

print("=" * 60)
print("📝 测试 2: 创建无预订的行程")
print("=" * 60)
print()

future_time_2 = (datetime.now() + timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S')

print(f"🚗 Alice 发布行程（1 分钟后）")
print(f"   时间: {future_time_2}")

ride2 = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "title": "Test WITHOUT Booking → Should be EXPIRED",
        "departureLocation": "Cornell University",
        "destinationLocation": "Boston",
        "departureTime": future_time_2,
        "availableSeats": 3,
        "pricePerSeat": 40,
        "description": "This ride will have NO bookings"
    }
)

if not ride2.json().get('success'):
    print(f"❌ 行程创建失败: {ride2.json()}")
    exit(1)

ride2_id = ride2.json()['data']['ride']['id']
print(f"✅ 行程创建成功 (ID: {ride2_id[:8]}...)")
print()
print("🎯 预期结果: 1 分钟后状态应该是 'expired' ⚪")
print()

# ==========================================
# 等待和验证
# ==========================================

print("=" * 60)
print("⏳ 等待行程过期")
print("=" * 60)
print()

for i in range(65, 0, -5):
    print(f"⏱️  倒计时: {i} 秒...", end='\r')
    time.sleep(5)

print()
print()
print("=" * 60)
print("🔍 检查状态")
print("=" * 60)
print()

# 查询 My Trips
my_trips = requests.get(
    f"{API_URL}/carpooling/my-trips",
    headers={"Authorization": f"Bearer {alice_token}"}
)

if not my_trips.json().get('success'):
    print("❌ 获取 My Trips 失败")
    exit(1)

trips = my_trips.json()['data']['trips']

# 找到测试行程
test_ride1 = None
test_ride2 = None

for trip in trips:
    if trip.get('id') == ride1_id:
        test_ride1 = trip
    elif trip.get('id') == ride2_id:
        test_ride2 = trip

print("📊 测试结果:")
print()

if test_ride1:
    status1 = test_ride1.get('status')
    if status1 == 'completed':
        print("✅ 测试 1 通过: 有预订的行程 → 'completed' 🔵")
    else:
        print(f"❌ 测试 1 失败: 预期 'completed'，实际 '{status1}'")
    print(f"   行程: {test_ride1.get('title')}")
    print(f"   状态: {status1}")
    print(f"   预订数: {test_ride1.get('total_bookings', 0)}")
else:
    print("❌ 测试 1: 未找到行程 1")

print()

if test_ride2:
    status2 = test_ride2.get('status')
    if status2 == 'expired':
        print("✅ 测试 2 通过: 无预订的行程 → 'expired' ⚪")
    else:
        print(f"❌ 测试 2 失败: 预期 'expired'，实际 '{status2}'")
    print(f"   行程: {test_ride2.get('title')}")
    print(f"   状态: {status2}")
    print(f"   预订数: {test_ride2.get('total_bookings', 0)}")
else:
    print("❌ 测试 2: 未找到行程 2")

print()
print("=" * 60)
print("🎉 测试完成！")
print("=" * 60)
print()
print("💡 提示:")
print("   - 刷新浏览器的 My Trips 页面")
print("   - 查看两个测试行程的状态")
print("   - 应该看到一个 🔵 已完成，一个 ⚪ 已过期")
print()

EOF




