#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseLoginIssues() {
  try {
    console.log('🔍 诊断登录问题...\n')

    // 检查两个用户的信息
    const emails = ['rz469@cornell.edu', 'zw876@cornell.edu']

    for (const email of emails) {
      console.log(`👤 检查用户: ${email}`)

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, password_hash, verification_status, is_verified, created_at')
        .eq('email', email)
        .single()

      if (error) {
        console.log(`   ❌ 用户不存在: ${error.message}`)
        continue
      }

      console.log(`   📧 Email: ${user.email}`)
      console.log(`   👤 Name: ${user.first_name} ${user.last_name}`)
      console.log(`   ✅ Verified: ${user.verification_status === 'verified' || user.is_verified}`)
      console.log(`   🔒 Password hash exists: ${user.password_hash ? '✅' : '❌'}`)

      if (user.password_hash) {
        console.log(`   🔑 Hash length: ${user.password_hash.length}`)
        console.log(`   📝 Hash preview: ${user.password_hash.substring(0, 20)}...`)

        // 测试标准密码 "123456"
        try {
          const isValid = await bcrypt.compare('123456', user.password_hash)
          console.log(`   🧪 Password "123456" valid: ${isValid ? '✅' : '❌'}`)
        } catch (hashError) {
          console.log(`   ❌ Password hash test failed: ${hashError.message}`)
        }
      }

      console.log('')
    }

    // 测试用于重置密码的token
    console.log('🔗 检查重置密码token...')
    const { data: tokens, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', 'rz469@cornell.edu')
      .order('created_at', { ascending: false })
      .limit(1)

    if (tokenError) {
      console.log(`   ❌ Token查询失败: ${tokenError.message}`)
    } else if (tokens && tokens.length > 0) {
      const token = tokens[0]
      console.log(`   ✅ 找到重置token:`)
      console.log(`   📧 Email: ${token.email}`)
      console.log(`   🎫 Token: ${token.token.substring(0, 20)}...`)
      console.log(`   ⏰ Created: ${token.created_at}`)
      console.log(`   ⏳ Expires: ${token.expires_at}`)
      console.log(`   📋 Used: ${token.used}`)
    } else {
      console.log(`   ❌ 没有找到重置token`)
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error)
  }
}

diagnoseLoginIssues()