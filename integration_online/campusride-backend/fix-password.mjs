#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPassword() {
  try {
    const email = 'rz469@cornell.edu'
    const newPassword = '123456'

    console.log(`🔐 为用户 ${email} 重置密码...`)

    // 生成新的密码哈希
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    console.log('🔒 新密码哈希生成完成')

    // 更新数据库中的密码
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email)
      .select()

    if (error) {
      console.error('❌ 密码更新失败:', error.message)
      return
    }

    console.log('✅ 密码更新成功!')
    console.log('用户信息:', {
      email: data[0].email,
      name: `${data[0].first_name} ${data[0].last_name}`,
      updated: '密码已重置为 123456'
    })

    // 测试新密码
    console.log('\n🧪 测试新密码...')
    const testHash = data[0].password_hash
    const isValid = await bcrypt.compare(newPassword, testHash)

    if (isValid) {
      console.log('✅ 密码验证成功!')
    } else {
      console.log('❌ 密码验证失败!')
    }

  } catch (error) {
    console.error('❌ 操作失败:', error)
  }
}

fixPassword()