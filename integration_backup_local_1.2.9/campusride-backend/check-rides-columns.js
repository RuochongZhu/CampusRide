import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  // 直接查询 rides 表结构
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('rides 表当前列:', Object.keys(data[0]));
    console.log('是否有 ride_type:', 'ride_type' in data[0]);
    console.log('是否有 flexibility:', 'flexibility' in data[0]);
  } else {
    // 表为空，尝试插入一条测试数据看错误
    console.log('rides 表为空，尝试查询表结构...');
    
    const { error: insertError } = await supabase
      .from('rides')
      .insert({
        driver_id: '00000000-0000-0000-0000-000000000000',
        title: 'test',
        departure_location: 'test',
        destination_location: 'test',
        departure_time: new Date().toISOString(),
        available_seats: 1,
        price_per_seat: 0,
        ride_type: 'offer'
      });
    
    console.log('插入测试结果:', insertError);
  }
}

check();
