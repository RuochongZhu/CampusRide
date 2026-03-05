#!/bin/bash

# 测试邮箱验证流程
# 使用方法: ./test-email-verification.sh

echo "======================================"
echo "📧 测试邮箱验证流程"
echo "======================================"
echo ""

# 生成随机NetID
RANDOM_NUM=$((RANDOM % 10000))
TEST_EMAIL="test${RANDOM_NUM}@cornell.edu"
TEST_PASSWORD="Test12345"
TEST_NICKNAME="TestUser${RANDOM_NUM}"

echo "📝 测试账号信息:"
echo "   邮箱: $TEST_EMAIL"
echo "   密码: $TEST_PASSWORD"
echo "   昵称: $TEST_NICKNAME"
echo ""

# 步骤1: 注册新用户
echo "🔹 步骤1: 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\",
    \"nickname\": \"$TEST_NICKNAME\"
  }")

echo "注册响应:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# 检查是否注册成功
if echo "$REGISTER_RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ 注册成功！"

  # 提取用户ID
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -oP '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   用户ID: $USER_ID"
  echo ""

  echo "📬 验证邮件应该已经发送到: $TEST_EMAIL"
  echo ""
  echo "⚠️  由于这是测试环境，请检查以下内容:"
  echo "   1. 查看后端日志中的验证链接"
  echo "   2. 或者在Resend控制台查看邮件发送状态"
  echo "   3. 验证链接格式: http://localhost:5173/verify-email/{TOKEN}"
  echo ""

  # 步骤2: 查看Supabase中的验证状态
  echo "🔹 步骤2: 查询用户验证状态..."
  echo "   (需要在Supabase控制台手动查看)"
  echo "   SQL查询: SELECT email, email_verified, email_verification_token FROM users WHERE email = '$TEST_EMAIL';"
  echo ""

  echo "======================================"
  echo "📋 接下来的步骤:"
  echo "======================================"
  echo "1. 从后端日志中复制验证链接"
  echo "2. 在浏览器中访问该链接"
  echo "3. 或者从Resend控制台查看发送的邮件"
  echo "4. 点击验证链接完成邮箱验证"
  echo ""
  echo "💡 提示: 如果你有Cornell邮箱，可以直接使用真实邮箱测试！"
  echo ""

else
  echo "❌ 注册失败！"
  ERROR_MSG=$(echo "$REGISTER_RESPONSE" | grep -oP '"message":"[^"]*"' | head -1)
  echo "   错误信息: $ERROR_MSG"
  echo ""
fi

echo "======================================"
echo "🔍 Resend配置检查"
echo "======================================"
echo "RESEND_API_KEY: ${RESEND_API_KEY:-未设置}"
echo "RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL:-noreply@socialinteraction.club}"
echo "FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}"
echo ""
echo "✅ 测试完成！"
