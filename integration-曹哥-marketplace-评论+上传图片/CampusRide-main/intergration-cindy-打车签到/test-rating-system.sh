#!/bin/bash

echo "🎯 测试评分系统 - 完整流程"
echo "=================================="
echo ""

cd /Users/xinyuepan/Desktop/intergration-backup_副本

python3 << 'EOF'
import requests
from datetime import datetime, timedelta
import time

API_URL = "http://localhost:3001/api/v1"

print("=" * 70)
print("🧪 评分系统完整测试")
print("=" * 70)
print()

# ==========================================
# 步骤 1: 登录账户
# ==========================================
print("📝 步骤 1: 登录账户")
print("-" * 70)

# 登录 Alice (司机)
alice_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "alice@cornell.edu",
    "password": "alice1234"
})

if not alice_login.json().get('success'):
    print("❌ Alice 登录失败")
    exit(1)

alice_token = alice_login.json()['data']['token']
alice_id = alice_login.json()['data']['user']['id']
alice_name = alice_login.json()['data']['user'].get('first_name', 'Alice')
print(f"✅ Alice 登录成功 (司机)")

# 登录 Demo (乘客)
demo_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "demo@cornell.edu",
    "password": "demo1234"
})

if not demo_login.json().get('success'):
    print("❌ Demo 登录失败")
    print("   请检查账户是否存在:")
    print("   邮箱: demo@cornell.edu")
    print("   密码: demo1234")
    exit(1)

demo_token = demo_login.json()['data']['token']
demo_id = demo_login.json()['data']['user']['id']
demo_name = demo_login.json()['data']['user'].get('first_name', 'Demo')
print(f"✅ Demo 登录成功 (乘客)")
print()

# ==========================================
# 步骤 2: Alice 发布行程 (1.5 分钟后)
# ==========================================
print("=" * 70)
print("📝 步骤 2: Alice 发布行程")
print("-" * 70)

future_time = (datetime.now() + timedelta(minutes=1, seconds=30)).strftime('%Y-%m-%dT%H:%M:%S')
print(f"⏰ 出发时间: {future_time} (1.5 分钟后)")
print()

ride = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "title": "Rating Test - Cornell to NYC",
        "departureLocation": "Cornell University, Ithaca",
        "destinationLocation": "New York City",
        "departureTime": future_time,
        "availableSeats": 3,
        "pricePerSeat": 35,
        "description": "Test ride for rating system"
    }
)

if not ride.json().get('success'):
    print(f"❌ 行程创建失败: {ride.json()}")
    exit(1)

ride_id = ride.json()['data']['ride']['id']
print(f"✅ 行程创建成功")
print(f"   ID: {ride_id[:8]}...")
print(f"   标题: Rating Test - Cornell to NYC")
print()

# ==========================================
# 步骤 3: Demo 预订行程
# ==========================================
print("=" * 70)
print("📝 步骤 3: Demo 预订行程")
print("-" * 70)

booking = requests.post(
    f"{API_URL}/carpooling/rides/{ride_id}/book",
    headers={"Authorization": f"Bearer {demo_token}"},
    json={
        "seatsBooked": 1,
        "contactNumber": "+1234567890"
    }
)

if not booking.json().get('success'):
    print(f"❌ 预订失败: {booking.json()}")
    exit(1)

booking_id = booking.json()['data']['booking']['id']
print(f"✅ Demo 预订成功")
print(f"   Booking ID: {booking_id[:8]}...")
print()

# ==========================================
# 步骤 4: Alice 接受预订
# ==========================================
print("=" * 70)
print("📝 步骤 4: Alice 接受预订")
print("-" * 70)

# 获取通知
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
    if n.get('trip_id') == ride_id and n.get('type') == 'booking_request':
        target_notif = n
        break

if not target_notif:
    print("❌ 未找到预订通知")
    exit(1)

print(f"✅ 找到预订通知")

# 接受预订
accept = requests.post(
    f"{API_URL}/notifications/{target_notif['id']}/respond",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={"action": "accept"}
)

if not accept.json().get('success'):
    print(f"❌ 接受失败: {accept.json()}")
    exit(1)

print(f"✅ Alice 接受预订")
print()

# ==========================================
# 步骤 5: 等待行程完成
# ==========================================
print("=" * 70)
print("📝 步骤 5: 等待行程完成")
print("-" * 70)
print()
print("⏳ 倒计时 95 秒...")
print()

for i in range(95, 0, -5):
    mins = i // 60
    secs = i % 60
    print(f"   ⏱️  {mins:02d}:{secs:02d} 剩余...", end='\r')
    time.sleep(5)

print()
print()
print("✅ 行程应该已经完成")
print()

# 检查行程状态
time.sleep(2)
my_trips = requests.get(
    f"{API_URL}/carpooling/my-trips",
    headers={"Authorization": f"Bearer {alice_token}"}
)

if my_trips.json().get('success'):
    trips = my_trips.json()['data']['trips']
    test_trip = None
    for trip in trips:
        if trip.get('id') == ride_id:
            test_trip = trip
            break
    
    if test_trip:
        status = test_trip.get('status')
        print(f"📊 行程状态: {status}")
        if status == 'completed':
            print("   ✅ 状态正确 - 已完成")
        else:
            print(f"   ⚠️  状态是 {status}，不是 completed")
            print("   可能需要等待更久或手动刷新")

print()

# ==========================================
# 步骤 6: 测试评分功能
# ==========================================
print("=" * 70)
print("📝 步骤 6: 测试评分功能")
print("-" * 70)
print()

# 6.1: Demo 给 Alice 评分
print("👤 Demo (乘客) 给 Alice (司机) 评分...")

demo_rating = requests.post(
    f"{API_URL}/ratings",
    headers={"Authorization": f"Bearer {demo_token}"},
    json={
        "tripId": ride_id,
        "rateeId": alice_id,
        "score": 5,
        "comment": "Great driver! Very punctual and friendly."
    }
)

if demo_rating.json().get('success'):
    print("✅ Demo 评分成功")
    print("   评分: ⭐⭐⭐⭐⭐ (5/5)")
    print("   评语: Great driver! Very punctual and friendly.")
else:
    error_msg = demo_rating.json().get('error', {}).get('message', 'Unknown error')
    print(f"❌ Demo 评分失败: {error_msg}")

print()

# 6.2: Alice 给 Demo 评分
print("👤 Alice (司机) 给 Demo (乘客) 评分...")

alice_rating = requests.post(
    f"{API_URL}/ratings",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "tripId": ride_id,
        "rateeId": demo_id,
        "score": 4,
        "comment": "Nice passenger, on time!"
    }
)

if alice_rating.json().get('success'):
    print("✅ Alice 评分成功")
    print("   评分: ⭐⭐⭐⭐ (4/5)")
    print("   评语: Nice passenger, on time!")
else:
    error_msg = alice_rating.json().get('error', {}).get('message', 'Unknown error')
    print(f"❌ Alice 评分失败: {error_msg}")

print()

# ==========================================
# 步骤 7: 验证评分结果
# ==========================================
print("=" * 70)
print("📝 步骤 7: 验证评分结果")
print("-" * 70)
print()

# 7.1: 查看 Alice 的平均评分
alice_avg = requests.get(
    f"{API_URL}/ratings/average/{alice_id}"
)

if alice_avg.json().get('success'):
    avg_data = alice_avg.json()['data']
    print(f"👤 Alice 的评分:")
    print(f"   平均分: {avg_data.get('averageRating', 0):.2f} / 5.00")
    print(f"   总评分数: {avg_data.get('totalRatings', 0)}")
else:
    print("⚠️  无法获取 Alice 的评分")

print()

# 7.2: 查看 Demo 的平均评分
demo_avg = requests.get(
    f"{API_URL}/ratings/average/{demo_id}"
)

if demo_avg.json().get('success'):
    avg_data = demo_avg.json()['data']
    print(f"👤 Demo 的评分:")
    print(f"   平均分: {avg_data.get('averageRating', 0):.2f} / 5.00")
    print(f"   总评分数: {avg_data.get('totalRatings', 0)}")
else:
    print("⚠️  无法获取 Demo 的评分")

print()

# 7.3: 查看这个行程的所有评分
trip_ratings = requests.get(
    f"{API_URL}/ratings/trip/{ride_id}"
)

if trip_ratings.json().get('success'):
    ratings = trip_ratings.json()['data']['ratings']
    print(f"🚗 行程的所有评分 (共 {len(ratings)} 条):")
    print()
    for r in ratings:
        rater_name = "Alice" if r['rater_id'] == alice_id else "Demo"
        ratee_name = "Demo" if r['ratee_id'] == demo_id else "Alice"
        stars = "⭐" * r['score']
        print(f"   {rater_name} → {ratee_name}: {stars} ({r['score']}/5)")
        if r.get('comment'):
            print(f"      \"{r['comment']}\"")
        print()

print()

# ==========================================
# 步骤 8: 测试重复评分保护
# ==========================================
print("=" * 70)
print("📝 步骤 8: 测试重复评分保护")
print("-" * 70)
print()

print("🔄 Demo 尝试再次评分 Alice...")
duplicate_rating = requests.post(
    f"{API_URL}/ratings",
    headers={"Authorization": f"Bearer {demo_token}"},
    json={
        "tripId": ride_id,
        "rateeId": alice_id,
        "score": 3,
        "comment": "Trying to rate again"
    }
)

if duplicate_rating.json().get('success'):
    print("❌ 测试失败: 允许了重复评分")
else:
    error_msg = duplicate_rating.json().get('error', {}).get('message', '')
    if 'already rated' in error_msg.lower() or 'duplicate' in error_msg.lower():
        print("✅ 测试通过: 正确阻止了重复评分")
        print(f"   错误消息: {error_msg}")
    else:
        print(f"⚠️  被阻止，但原因不同: {error_msg}")

print()

# ==========================================
# 总结
# ==========================================
print("=" * 70)
print("🎉 测试完成！")
print("=" * 70)
print()
print("✅ 完成的测试:")
print("   1. 创建行程")
print("   2. 乘客预订")
print("   3. 司机接受")
print("   4. 等待行程完成 (completed)")
print("   5. 双方互相评分")
print("   6. 查看平均评分")
print("   7. 查看行程评分")
print("   8. 测试重复评分保护")
print()
print("🌐 现在可以在浏览器中查看:")
print(f"   1. 登录 Alice 账户 (alice@cornell.edu / alice1234)")
print(f"   2. 进入 My Trips")
print(f"   3. 找到行程: 'Rating Test - Cornell to NYC'")
print(f"   4. 查看评分详情")
print()
print("   或者登录 Demo 账户 (demo@cornell.edu / demo1234)")
print(f"   在 My Trips 中查看同一个行程的评分")
print()
print("=" * 70)

EOF

