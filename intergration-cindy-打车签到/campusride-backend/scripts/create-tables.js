import { supabaseAdmin } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  console.log('🚀 开始创建数据库表...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 测试连接
    console.log('1️⃣ 测试数据库连接...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('_test')
      .select('*')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      // 如果不是"表不存在"错误，则可能有连接问题
      if (testError.message && testError.message.includes('fetch failed')) {
        console.log('❌ 无法连接到 Supabase');
        console.log('💡 请确认项目已就绪，运行: node scripts/check-supabase-now.js');
        process.exit(1);
      }
    }
    
    console.log('✅ 数据库连接成功\n');

    // 读取 schema 文件
    console.log('2️⃣ 读取数据库架构文件...');
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ 找不到 schema.sql 文件');
      console.log('路径:', schemaPath);
      process.exit(1);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ 架构文件读取成功\n');

    // 在 Supabase 中执行 SQL
    console.log('3️⃣ 创建数据库表...');
    console.log('💡 这可能需要几秒钟...\n');
    
    // 通过 Supabase SQL Editor API 执行
    // 注意：这需要使用 Supabase Management API 或直接在 Dashboard 中执行
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 重要提示：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('需要在 Supabase Dashboard 中手动执行 SQL：\n');
    console.log('1. 打开 Supabase Dashboard: https://app.supabase.com');
    console.log('2. 进入你的项目');
    console.log('3. 左侧菜单 → SQL Editor');
    console.log('4. 点击 "+ New query"');
    console.log('5. 复制粘贴以下文件的内容：');
    console.log(`   ${schemaPath}`);
    console.log('6. 点击 "Run" 执行\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📄 SQL 文件内容（复制到 Supabase）：\n');
    console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv\n');
    console.log(schemaSql.substring(0, 500) + '...\n');
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n');
    console.log(`💡 完整文件位置: ${schemaPath}\n`);
    
    console.log('✅ 或者使用自动化方式：');
    console.log('   我会为你准备一个简化的创建脚本\n');
    
    // 创建基础表
    console.log('4️⃣ 尝试创建基础表...\n');
    
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            university VARCHAR(255),
            major VARCHAR(255),
            points INTEGER DEFAULT 0,
            avatar_url TEXT,
            bio TEXT,
            phone VARCHAR(20),
            email_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      }
    ];

    for (const table of tables) {
      try {
        console.log(`   创建表: ${table.name}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          console.log(`   ⚠️  ${table.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table.name} 创建成功`);
        }
      } catch (err) {
        console.log(`   ℹ️  ${table.name}: 需要手动创建`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 下一步：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. 在 Supabase Dashboard 执行完整的 SQL');
    console.log('2. 然后运行: node scripts/create-demo-user.js');
    console.log('3. 最后就可以登录了！\n');
    
  } catch (error) {
    console.log('\n❌ 错误:', error.message);
    console.log('\n💡 请按照上面的说明在 Supabase Dashboard 中手动创建表');
  }
};

createTables();


