#!/bin/bash

# My Trips & Rating System - 快速测试脚本
# 用于验证所有新功能是否正常工作

set -e

API_URL="http://localhost:3001/api/v1"
ALICE_EMAIL="alice@cornell.edu"
ALICE_PASSWORD="alice1234"
BOB_EMAIL="bob@cornell.edu"
BOB_PASSWORD="bob1234"

echo "🚀 My Trips & Rating System - 测试脚本"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# ==========================================
# 测试 1: 健康检查
# ==========================================
echo "📋 测试 1: 后端健康检查"
echo "------------------------------------------"

if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    success "后端服务运行正常"
else
    error "后端服务无法访问"
    exit 1
fi

echo ""

# ==========================================
# 测试 2: 用户登录
# ==========================================
echo "📋 测试 2: 用户认证"
echo "------------------------------------------"

# Alice 登录
info "Alice 登录中..."
TOKEN_ALICE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALICE_EMAIL\",\"password\":\"$ALICE_PASSWORD\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -n "$TOKEN_ALICE" ]; then
    success "Alice 登录成功"
else
    error "Alice 登录失败"
    exit 1
fi

# Bob 登录 (可选)
# info "Bob 登录中..."
# TOKEN_BOB=$(curl -s -X POST "$API_URL/auth/login" \
#   -H "Content-Type: application/json" \
#   -d "{\"email\":\"$BOB_EMAIL\",\"password\":\"$BOB_PASSWORD\"}" \
#   | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

# if [ -n "$TOKEN_BOB" ]; then
#     success "Bob 登录成功"
# else
#     error "Bob 登录失败"
# fi

echo ""

# ==========================================
# 测试 3: My Trips API
# ==========================================
echo "📋 测试 3: My Trips API"
echo "------------------------------------------"

info "获取 Alice 的所有行程..."
TRIPS_RESPONSE=$(curl -s -X GET "$API_URL/carpooling/my-trips" \
  -H "Authorization: Bearer $TOKEN_ALICE")

if echo "$TRIPS_RESPONSE" | grep -q "\"success\":true"; then
    success "My Trips API 响应成功"
    
    # 显示行程数量
    TRIP_COUNT=$(echo "$TRIPS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data['data']['trips']))" 2>/dev/null || echo "0")
    info "找到 $TRIP_COUNT 个行程"
    
    # 显示行程详情（前3个）
    echo "$TRIPS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    trips = data['data']['trips'][:3]
    for i, trip in enumerate(trips, 1):
        role = trip.get('role', 'unknown')
        title = trip.get('title', 'No title')
        status = trip.get('status') if role == 'driver' else trip.get('booking_status', 'unknown')
        print(f'  {i}. {title} [{role}] - Status: {status}')
except Exception as e:
    pass
" 2>/dev/null
else
    error "My Trips API 失败"
    echo "$TRIPS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TRIPS_RESPONSE"
fi

echo ""

# ==========================================
# 测试 4: 创建测试行程
# ==========================================
echo "📋 测试 4: 创建测试行程"
echo "------------------------------------------"

info "Alice 创建测试行程..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/carpooling/rides" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -d '{
    "title": "Test Trip - Cornell to NYC",
    "departureLocation": "Cornell University, Ithaca NY",
    "destinationLocation": "JFK Airport, New York",
    "departureTime": "2025-12-01T08:00:00.000Z",
    "availableSeats": 3,
    "pricePerSeat": 35,
    "description": "Test trip for My Trips system"
  }')

if echo "$CREATE_RESPONSE" | grep -q "\"success\":true"; then
    success "测试行程创建成功"
    
    # 提取行程 ID
    TRIP_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['ride']['id'])" 2>/dev/null)
    info "行程 ID: $TRIP_ID"
else
    error "测试行程创建失败"
    echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
fi

echo ""

# ==========================================
# 测试 5: 评分 API（用户平均评分）
# ==========================================
echo "📋 测试 5: 评分系统 API"
echo "------------------------------------------"

# 获取 Alice 的用户 ID
ALICE_ID=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)

if [ -n "$ALICE_ID" ]; then
    info "获取 Alice 的平均评分..."
    RATING_RESPONSE=$(curl -s -X GET "$API_URL/ratings/average/$ALICE_ID")
    
    if echo "$RATING_RESPONSE" | grep -q "\"success\":true"; then
        success "评分 API 响应成功"
        
        echo "$RATING_RESPONSE" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)['data']
avg = data.get('averageScore')
total = data.get('totalRatings', 0)
if avg:
    print(f"  Alice 的平均评分: {avg} ⭐ (共 {total} 个评价)")
else:
    print(f"  Alice 暂无评分 (共 {total} 个评价)")
EOF
    else
        error "评分 API 失败"
    fi
else
    error "无法获取 Alice 的用户 ID"
fi

echo ""

# ==========================================
# 测试 6: 通知系统
# ==========================================
echo "📋 测试 6: 通知系统"
echo "------------------------------------------"

info "获取 Alice 的通知..."
NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $TOKEN_ALICE")

if echo "$NOTIF_RESPONSE" | grep -q "\"success\":true"; then
    success "通知 API 响应成功"
    
    NOTIF_COUNT=$(echo "$NOTIF_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['notifications']))" 2>/dev/null || echo "0")
    info "找到 $NOTIF_COUNT 个通知"
else
    error "通知 API 失败"
fi

echo ""

# ==========================================
# 测试总结
# ==========================================
echo "=========================================="
echo "🎉 测试完成！"
echo "=========================================="
echo ""
echo "✅ 已测试的功能:"
echo "  1. 后端健康检查"
echo "  2. 用户认证 (登录)"
echo "  3. My Trips API (获取所有行程)"
echo "  4. 创建行程功能"
echo "  5. 评分系统 API"
echo "  6. 通知系统"
echo ""
echo "📝 手动测试项:"
echo "  - 乘客取消预订功能"
echo "  - 司机取消预订功能"
echo "  - 创建评分功能（需要行程已开始）"
echo "  - 前端 UI 显示（角色徽章、按钮状态）"
echo ""
echo "📚 文档:"
echo "  - 完整文档: MY_TRIPS_AND_RATING_SYSTEM.md"
echo "  - 安装指南: INSTALLATION_GUIDE.md"
echo ""

