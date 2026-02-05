import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  
  // 查询 marketplace_items 数量
  const { count, error } = await supabase
    .from('marketplace_items')
    .select('*', { count: 'exact', head: true });
  
  console.log('Marketplace 帖子总数:', count);
  if (error) console.log('错误:', error);
  
  // 查询前5条记录
  const { data } = await supabase
    .from('marketplace_items')
    .select('id, title, price, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('最新5条帖子:', JSON.stringify(data, null, 2));
}

check();
