import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  
  // 用户总数
  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  console.log('用户总数:', userCount);
  
  // marketplace 总数
  const { count: itemCount } = await supabase.from('marketplace_items').select('*', { count: 'exact', head: true });
  console.log('Marketplace 帖子总数:', itemCount);
  
  // activities 总数
  const { count: activityCount } = await supabase.from('activities').select('*', { count: 'exact', head: true });
  console.log('Activities 总数:', activityCount);
  
  // rides 总数
  const { count: rideCount } = await supabase.from('rides').select('*', { count: 'exact', head: true });
  console.log('Rides 总数:', rideCount);
}
check();
