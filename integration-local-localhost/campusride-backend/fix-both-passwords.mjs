#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBothPasswords() {
  try {
    const users = [
      { email: 'rz469@cornell.edu', password: '123456' },
      { email: 'zw876@cornell.edu', password: '123456' }
    ]

    const saltRounds = 12

    for (const user of users) {
      console.log(`🔐 为用户 ${user.email} 重置密码...`)

      // 生成新的密码哈希
      const hashedPassword = await bcrypt.hash(user.password, saltRounds)

      // 更新数据库中的密码
      const { data, error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('email', user.email)
        .select()

      if (error) {
        console.error(`❌ ${user.email} 密码更新失败:`, error.message)
        continue
      }

      console.log(`✅ ${user.email} 密码更新成功!`)

      // 测试新密码
      const isValid = await bcrypt.compare(user.password, hashedPassword)
      console.log(`🧪 ${user.email} 密码验证: ${isValid ? '✅' : '❌'}`)
      console.log('')
    }

    // 测试两个用户的登录API
    console.log('🌐 测试API登录...')

    for (const user of users) {
      try {
        const response = await fetch('http://localhost:3001/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            password: user.password
          })
        })

        const result = await response.json()

        if (response.ok) {
          console.log(`✅ ${user.email} API登录成功`)
          console.log(`   用户名: ${result.data.user.first_name} ${result.data.user.last_name}`)
        } else {
          console.log(`❌ ${user.email} API登录失败: ${result.error?.message || 'Unknown error'}`)
        }
      } catch (apiError) {
        console.log(`❌ ${user.email} API请求失败: ${apiError.message}`)
      }
    }

  } catch (error) {
    console.error('❌ 操作失败:', error)
  }
}

fixBothPasswords()