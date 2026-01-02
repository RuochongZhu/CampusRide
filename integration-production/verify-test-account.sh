#!/bin/bash

# 手动验证测试账号
# 使用方法: ./verify-test-account.sh <email>

EMAIL=${1:-"testactivity@cornell.edu"}

echo "======================================"
echo "📧 手动验证测试账号"
echo "======================================"
echo ""
echo "正在验证邮箱: $EMAIL"
echo ""

# 调用后端API手动验证账号
# 注意：这需要一个管理员端点，或者我们直接通过Supabase更新

echo "方法1: 通过Supabase SQL直接更新"
echo "======================================"
echo ""
echo "请在Supabase SQL Editor中执行以下SQL:"
echo ""
echo "UPDATE users"
echo "SET"
echo "  email_verified = true,"
echo "  is_verified = true,"
echo "  verification_status = 'verified',"
echo "  email_verification_token = NULL,"
echo "  email_verification_expires = NULL"
echo "WHERE email = '$EMAIL';"
echo ""
echo "======================================"
echo ""

echo "方法2: 使用测试API端点"
echo "======================================"
echo ""

# 创建临时的验证API调用
curl -s -X POST http://localhost:3001/api/v1/auth/manual-verify \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ API调用成功（如果端点存在）"
else
  echo "⚠️  API端点可能不存在，请使用方法1"
fi

echo ""
echo "======================================"
echo "✅ 完成！请尝试登录测试账号"
echo "======================================"
echo ""
echo "测试账号信息:"
echo "  邮箱: $EMAIL"
echo "  密码: Test12345"
echo ""
