// 创建 Bob 测试账户
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBobUser() {
  console.log('📝 创建 Bob 测试账户');
  console.log('=' .repeat(60));
  console.log();

  try {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'bob@cornell.edu')
      .single();

    if (existing) {
      console.log('✅ Bob 账户已存在');
      console.log(`   ID: ${existing.id}`);
      console.log(`   邮箱: ${existing.email}`);
      console.log();
      console.log('🎯 可以直接运行评分测试:');
      console.log('   bash test-rating-system.sh');
      return;
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash('bob12345', 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: 'bob@cornell.edu',
        password: hashedPassword,
        student_id: 'bob002',
        first_name: 'Bob',
        last_name: 'Smith',
        university: 'Cornell University',
        role: 'student',
        is_verified: true,
        is_active: true,
        points: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Bob 账户创建成功！');
    console.log();
    console.log('账户信息:');
    console.log('   邮箱: bob@cornell.edu');
    console.log('   密码: bob12345');
    console.log('   昵称: Bob');
    console.log(`   ID: ${newUser.id}`);
    console.log();
    console.log('🎯 现在可以运行评分测试:');
    console.log('   bash test-rating-system.sh');
    console.log();

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createBobUser();

