import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', 'rz469@cornell.edu')
    .single();
  
  console.log('用户密码哈希:', user?.password_hash);
  
  const passwords = ['test123', 'password', '123456', 'rz469', 'Rz469!', 'Cornell2024', 'demo1234', 'Zhu19990903!'];
  
  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, user.password_hash);
    console.log('密码:', pwd, '-> 匹配:', match);
  }
}

test();
