import { supabaseAdmin } from '../src/config/database.js';

/**
 * 检查users表的实际结构
 */
async function checkUserTableStructure() {
  console.log('🔍 Checking users table structure...');

  try {
    // 获取一个示例用户来查看实际的字段
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log('👤 Available user fields:', Object.keys(users[0]));
      console.log('📋 Sample user data:', users[0]);
    } else {
      console.log('⚠️ No users found');
    }

    // 测试用户表的基本查询
    const testUserId = '0d7cf564-1e6d-4772-a550-1bf607420269';
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (specificError) {
      console.error('❌ Error fetching specific user:', specificError);
    } else {
      console.log('✅ Specific user found:', specificUser);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }

  console.log('\n🎉 User table check completed!');
}

// 运行检查
checkUserTableStructure();