import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixRidesTable() {
  console.log('检查 rides 表结构...');
  
  // 查询 rides 表的列
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('查询错误:', error);
  } else {
    console.log('当前 rides 表列:', data.length > 0 ? Object.keys(data[0]) : '表为空');
  }
  
  // 尝试添加缺失的列
  console.log('\n尝试添加缺失的列...');
  
  // 使用 SQL 添加列
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) DEFAULT 'offer';
      ALTER TABLE rides ADD COLUMN IF NOT EXISTS flexibility TEXT;
    `
  });
  
  if (alterError) {
    console.log('添加列错误 (可能需要手动执行):', alterError);
    console.log('\n请在 Supabase SQL Editor 中执行以下 SQL:');
    console.log(`
ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) DEFAULT 'offer';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS flexibility TEXT;
    `);
  } else {
    console.log('列添加成功!');
  }
}

fixRidesTable();
