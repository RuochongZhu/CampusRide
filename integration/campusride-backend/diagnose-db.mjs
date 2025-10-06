#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

console.log('🔍 诊断 Supabase 数据库连接...\n')
console.log('配置信息:')
console.log('- URL:', supabaseUrl)
console.log('- Key:', supabaseKey ? '✅ 已配置' : '❌ 未配置')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  try {
    // 测试 1: 检查用户表
    console.log('📋 测试 1: 检查 users 表...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, university, email_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.log('❌ 用户表查询失败:', usersError.message)
    } else {
      console.log(`✅ 用户表正常，共 ${users.length} 条最近记录:`)
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} - ${user.first_name} ${user.last_name}`)
        console.log(`      验证状态: ${user.email_verified ? '✅ 已验证' : '❌ 未验证'}`)
        console.log(`      创建时间: ${user.created_at}`)
      })
    }
    console.log('')

    // 测试 2: 检查特定用户
    console.log('📋 测试 2: 查找用户 rz469@cornell.edu...')
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rz469@cornell.edu')
      .single()

    if (specificError) {
      console.log('❌ 用户不存在或查询失败:', specificError.message)
    } else {
      console.log('✅ 用户找到:')
      console.log('   Email:', specificUser.email)
      console.log('   Name:', `${specificUser.first_name} ${specificUser.last_name}`)
      console.log('   University:', specificUser.university)
      console.log('   Verified:', specificUser.email_verified ? '✅' : '❌')
      console.log('   Password Hash:', specificUser.password_hash ? '✅ 存在' : '❌ 不存在')
    }
    console.log('')

    // 测试 3: 检查新表（groups, thoughts, user_visibility）
    console.log('📋 测试 3: 检查新创建的表...')

    const tables = ['groups', 'group_members', 'thoughts', 'user_visibility']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: 表存在`)
      }
    }
    console.log('')

    // 测试 4: 统计数据
    console.log('📋 测试 4: 数据统计...')
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: groupCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })

    const { count: thoughtCount } = await supabase
      .from('thoughts')
      .select('*', { count: 'exact', head: true })

    console.log(`   用户总数: ${userCount || 0}`)
    console.log(`   小组总数: ${groupCount || 0}`)
    console.log(`   想法总数: ${thoughtCount || 0}`)
    console.log('')

    console.log('✅ 诊断完成!')

  } catch (error) {
    console.error('❌ 诊断过程出错:', error)
  }
}

diagnose()
