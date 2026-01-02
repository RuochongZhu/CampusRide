#!/usr/bin/env node

import { supabaseAdmin } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addPasswordResetFields() {
  console.log('🔧 添加密码重置字段到users表...\n');

  try {
    // 使用原始SQL添加字段
    const { error } = await supabaseAdmin.rpc('add_password_reset_columns');
    
    if (error) {
      console.log('📝 尝试直接执行SQL添加字段...');
      
      // 直接使用SQL添加字段
      const { error: sqlError1 } = await supabaseAdmin
        .from('users')
        .select('reset_password_token')
        .limit(1);
        
      if (sqlError1 && sqlError1.message.includes('does not exist')) {
        console.log('❌ 密码重置字段不存在，需要手动在Supabase中添加');
        console.log('\n请在Supabase Dashboard中执行以下SQL:');
        console.log('----------------------------------------');
        console.log('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);');
        console.log('ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP;');
        console.log('----------------------------------------');
        return;
      }
    }
    
    console.log('✅ 密码重置字段添加成功！');
    
  } catch (error) {
    console.error('❌ 添加字段时发生错误:', error);
    console.log('\n请在Supabase Dashboard中手动执行以下SQL:');
    console.log('----------------------------------------');
    console.log('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);');
    console.log('ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP;');
    console.log('----------------------------------------');
  }
}

addPasswordResetFields().then(() => process.exit(0));