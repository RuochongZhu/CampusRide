import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置！请检查.env文件');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 要验证的邮箱（可以从命令行参数获取）
const emailToVerify = process.argv[2] || 'testactivity@cornell.edu';

console.log('====================================');
console.log('📧 手动验证测试账号');
console.log('====================================');
console.log('');
console.log(`正在验证邮箱: ${emailToVerify}`);
console.log('');

async function verifyTestAccount() {
  try {
    // 查询用户
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailToVerify)
      .single();

    if (fetchError || !user) {
      console.error('❌ 未找到该邮箱的用户:', fetchError?.message || '用户不存在');
      return;
    }

    console.log('✅ 找到用户:');
    console.log(`   ID: ${user.id}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   当前验证状态: ${user.email_verified ? '已验证' : '未验证'}`);
    console.log('');

    // 更新验证状态
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        verification_status: 'verified'
      })
      .eq('email', emailToVerify)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 更新失败:', updateError.message);
      return;
    }

    console.log('✅ 验证成功！');
    console.log('');
    console.log('更新后的用户信息:');
    console.log(`   邮箱验证: ${updated.email_verified ? '✅ 已验证' : '❌ 未验证'}`);
    console.log(`   账号状态: ${updated.verification_status}`);
    console.log('');
    console.log('====================================');
    console.log('🎉 现在可以使用以下信息登录:');
    console.log('====================================');
    console.log(`   邮箱: ${emailToVerify}`);
    console.log('   密码: Test12345');
    console.log('');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
  }
}

verifyTestAccount();
