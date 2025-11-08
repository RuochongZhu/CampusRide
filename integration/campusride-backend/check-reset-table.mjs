#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPasswordResetTable() {
  try {
    console.log('🔍 检查密码重置表...\n')

    // 尝试查询表结构
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ password_reset_tokens 表不存在')
      console.log('   错误信息:', error.message)
      console.log('\n📝 需要创建此表来支持密码重置功能')

      // 提供创建表的SQL
      console.log('\n🔨 创建表的SQL语句:')
      console.log(`
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
      `)

    } else {
      console.log('✅ password_reset_tokens 表存在')
      console.log('   表中记录数量:', data?.length || 0)
    }

    // 检查邮件服务配置
    console.log('\n📧 检查邮件服务配置...')
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL
    const frontendUrl = process.env.FRONTEND_URL

    console.log('   RESEND_API_KEY:', resendApiKey ? '✅ 已配置' : '❌ 未配置')
    console.log('   FROM_EMAIL:', fromEmail || '❌ 未配置')
    console.log('   FRONTEND_URL:', frontendUrl || '❌ 未配置')

    // 测试邮件URL格式
    if (frontendUrl) {
      const testToken = 'test123abc'
      const resetUrl = `${frontendUrl}/reset-password/${testToken}`
      console.log('   测试重置URL格式:', resetUrl)
    }

  } catch (error) {
    console.error('❌ 检查失败:', error)
  }
}

checkPasswordResetTable()