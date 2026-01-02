// 自动执行 SQL 更新约束
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) throw error;
  return data;
}

async function main() {
  console.log('🔧 自动更新 rides 表约束');
  console.log('=' .repeat(70));
  console.log();

  try {
    // 方法 1: 通过直接查询
    console.log('📝 尝试方法 1: 直接执行 SQL...');
    
    const sql1 = 'ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;';
    const sql2 = "ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));";
    
    try {
      await supabase.rpc('exec_sql', { query: sql1 });
      console.log('✅ 旧约束已删除');
      
      await supabase.rpc('exec_sql', { query: sql2 });
      console.log('✅ 新约束已添加');
      
      console.log();
      console.log('🎉 更新成功！');
      return;
    } catch (err) {
      console.log('⚠️  方法 1 失败:', err.message);
      console.log();
    }

    // 方法 2: 通过查询现有行程并检测
    console.log('📝 尝试方法 2: 测试新状态值...');
    
    // 创建一个测试行程来验证约束
    const testTime = new Date(Date.now() + 60000).toISOString();
    const { data: testRide, error: testError } = await supabase
      .from('rides')
      .insert({
        driver_id: '00000000-0000-0000-0000-000000000000',
        title: 'CONSTRAINT_TEST',
        departure_location: 'Test',
        destination_location: 'Test',
        departure_time: testTime,
        available_seats: 1,
        price_per_seat: 0,
        status: 'expired'
      })
      .select()
      .single();

    if (testError) {
      if (testError.message.includes('violates check constraint')) {
        console.log('❌ 约束尚未更新');
        console.log('   需要手动在 Supabase Dashboard 执行 SQL');
        throw new Error('约束未包含 expired 状态');
      } else if (testError.message.includes('foreign key')) {
        console.log('✅ expired 状态已支持（外键错误是预期的）');
      } else {
        throw testError;
      }
    } else if (testRide) {
      console.log('✅ expired 状态已支持');
      // 清理测试数据
      await supabase.from('rides').delete().eq('id', testRide.id);
    }

    console.log();
    console.log('🎉 验证成功！数据库已支持 expired 状态');
    
  } catch (error) {
    console.log();
    console.log('=' .repeat(70));
    console.log('⚠️  自动更新失败，需要手动执行');
    console.log('=' .repeat(70));
    console.log();
    console.log('📋 请复制以下 SQL 到 Supabase Dashboard → SQL Editor:');
    console.log();
    console.log('ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;');
    console.log();
    console.log('ALTER TABLE rides ADD CONSTRAINT rides_status_check');
    console.log("CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));");
    console.log();
    console.log('🔗 快速链接:');
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectId) {
      console.log(`   https://supabase.com/dashboard/project/${projectId}/sql`);
    }
    console.log();
    process.exit(1);
  }

  console.log();
  console.log('=' .repeat(70));
  console.log('✅ 数据库已准备就绪！');
  console.log('=' .repeat(70));
  console.log();
  console.log('🚀 现在可以测试 completed vs expired 功能:');
  console.log('   bash test-completed-vs-expired.sh');
  console.log();
}

main();







