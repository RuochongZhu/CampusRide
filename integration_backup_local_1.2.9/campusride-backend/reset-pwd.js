import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetPassword() {
  const newPassword = 'Zr010930';
  const saltRounds = 12;
  
  // 生成新的密码哈希
  const newHash = await bcrypt.hash(newPassword, saltRounds);
  console.log('新密码哈希:', newHash);
  
  // 更新数据库
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('email', 'rz469@cornell.edu')
    .select('id, email');
  
  if (error) {
    console.log('更新错误:', error);
    return;
  }
  
  console.log('密码已重置:', data);
  
  // 验证新密码
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', 'rz469@cornell.edu')
    .single();
  
  const match = await bcrypt.compare(newPassword, user.password_hash);
  console.log('验证新密码匹配:', match);
}

resetPassword();
