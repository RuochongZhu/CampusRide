import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  console.log('连接的 Supabase URL:', process.env.SUPABASE_URL);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, student_id, password_hash, created_at')
    .eq('email', 'rz469@cornell.edu')
    .single();
  
  if (error) {
    console.log('查询错误:', error);
    return;
  }
  
  console.log('用户信息:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Student ID:', user.student_id);
  console.log('  密码哈希:', user.password_hash);
  console.log('  创建时间:', user.created_at);
  
  // 测试密码
  const pwd = 'Zr010930';
  const match = await bcrypt.compare(pwd, user.password_hash);
  console.log('  密码 Zr010930 匹配:', match);
}

check();
