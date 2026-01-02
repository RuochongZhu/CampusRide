#!/bin/bash

# 快速创建未来时间的测试行程
# 自动设置为 2 小时后

echo "🚗 创建测试行程（2小时后）"
echo ""

cd /Users/xinyuepan/Desktop/intergration-backup_副本

python3 << 'EOF'
import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:3001/api/v1"

# 登录
login = requests.post(f"{API_URL}/auth/login", json={
    "email": "alice@cornell.edu",
    "password": "alice1234"
})
token = login.json()['data']['token']

# 创建 2 小时后的行程
future_time = (datetime.now() + timedelta(hours=2)).strftime('%Y-%m-%dT%H:%M:%S')

print(f"📅 行程时间: {future_time} (2小时后)")
print()

response = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "title": "Test Ride - Cornell to NYC",
        "departureLocation": "Cornell University, Ithaca",
        "destinationLocation": "New York City",
        "departureTime": future_time,
        "availableSeats": 3,
        "pricePerSeat": 35,
        "description": "Test ride for development"
    }
)

if response.json().get('success'):
    ride = response.json()['data']['ride']
    print("✅ 行程创建成功！")
    print(f"   ID: {ride['id']}")
    print(f"   标题: {ride['title']}")
    print(f"   时间: {ride['departure_time']}")
    print()
    print("=" * 60)
    print("🎉 现在刷新浏览器，应该能在 Available Rides 看到了！")
    print("=" * 60)
else:
    error = response.json().get('error', {})
    print(f"❌ 创建失败: {error.get('message', 'Unknown')}")

EOF







