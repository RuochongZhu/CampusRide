#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createPasswordResetTable() {
  try {
    console.log('🔨 创建 password_reset_tokens 表...\n')

    // 创建表的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE
      );
    `

    // 创建索引的SQL
    const createIndexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);'
    ]

    // 执行创建表
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (tableError) {
      console.log('❌ 创建表失败，尝试直接SQL执行...')

      // 如果RPC失败，尝试使用原始SQL（这种方法在某些情况下可能不被支持）
      console.log('📝 请在Supabase SQL Editor中执行以下SQL:')
      console.log(createTableSQL)
      console.log('')
      createIndexesSQL.forEach((sql, i) => {
        console.log(`-- 索引 ${i + 1}:`)
        console.log(sql)
        console.log('')
      })
      return
    }

    console.log('✅ 表创建成功')

    // 创建索引
    for (const [index, sql] of createIndexesSQL.entries()) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql })
      if (indexError) {
        console.log(`❌ 索引 ${index + 1} 创建失败: ${indexError.message}`)
      } else {
        console.log(`✅ 索引 ${index + 1} 创建成功`)
      }
    }

    // 验证表是否创建成功
    console.log('\n🔍 验证表创建...')
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ 表验证失败:', error.message)
    } else {
      console.log('✅ 表验证成功，可以正常访问')
    }

  } catch (error) {
    console.error('❌ 创建失败:', error)
    console.log('\n📝 请手动在Supabase Dashboard的SQL Editor中执行以下SQL:')
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
  }
}

createPasswordResetTable()