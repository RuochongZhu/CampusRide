#!/bin/bash

echo "=== 测试 Groups API ==="
echo ""

# 获取 token（需要先登录）
echo "1. 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rz469@cornell.edu","password":"Ruochong@ZHU0520"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功, Token: ${TOKEN:0:20}..."
echo ""

# 测试创建小组
echo "2. 测试创建小组..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试小组","description":"这是一个测试小组"}')

echo "Response: $CREATE_RESPONSE" | jq .
echo ""

# 测试获取我的小组
echo "3. 测试获取我的小组..."
MY_GROUPS=$(curl -s -X GET http://localhost:3001/api/v1/groups/my \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $MY_GROUPS" | jq .
echo ""

# 测试发布想法
echo "4. 测试发布想法..."
THOUGHT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/thoughts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content":"这是一个测试想法",
    "group_id":null,
    "location":{"lat":42.4534,"lng":-76.4735}
  }')

echo "Response: $THOUGHT_RESPONSE" | jq .
echo ""

echo "=== 测试完成 ==="
