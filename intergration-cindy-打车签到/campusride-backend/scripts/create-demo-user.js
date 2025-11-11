import { supabaseAdmin } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createDemoUser = async () => {
  try {
    console.log('🔄 Creating demo user...');

    // 生成密码哈希
    const password = 'demo1234';
    const passwordHash = await bcrypt.hash(password, 12);

    // 准备用户数据
    const demoUser = {
      student_id: 'DEMO2024',
      email: 'demo@cornell.edu',
      password_hash: passwordHash,
      first_name: 'Demo',
      last_name: 'User',
      university: 'Cornell University',
      major: 'Computer Science',
      points: 0,
      email_verified: true,
      is_active: true
    };

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', demoUser.email)
      .single();

    if (existingUser) {
      console.log('🔄 Demo user already exists, updating password...');
      
      // 更新密码
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          password_hash: passwordHash,
          email_verified: true,
          is_active: true
        })
        .eq('email', demoUser.email);

      if (updateError) {
        console.error('❌ Failed to update demo user:', updateError);
        process.exit(1);
      }

      console.log('✅ Demo user password updated successfully');
    } else {
      // 创建新用户
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([demoUser])
        .select('id, email, first_name, last_name');

      if (insertError) {
        console.error('❌ Failed to create demo user:', insertError);
        process.exit(1);
      }

      console.log('✅ Demo user created successfully');
      console.log('User:', newUser[0]);
    }

    console.log('\n📧 Demo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    demo@cornell.edu');
    console.log('Password: demo1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createDemoUser();


