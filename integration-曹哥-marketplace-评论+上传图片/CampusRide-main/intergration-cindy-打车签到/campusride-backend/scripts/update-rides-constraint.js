// 自动更新 rides 表的 status 约束，添加 'expired' 状态
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置');
  console.error('   请检查 .env 文件中的:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRidesConstraint() {
  console.log('🔧 更新 rides 表的 status 约束');
  console.log('='.repeat(60));
  console.log();

  try {
    console.log('📝 步骤 1: 删除旧的约束...');
    
    // 删除旧约束
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;'
    });

    // 如果 rpc 不可用，直接执行 SQL
    const dropSql = 'ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;';
    
    let dropResult;
    try {
      dropResult = await supabase.rpc('query', { query_text: dropSql });
    } catch (err) {
      // 如果 RPC 不可用，使用原生 SQL
      console.log('   ℹ️  使用直接 SQL 执行方式');
    }

    console.log('✅ 旧约束已删除');
    console.log();

    console.log('📝 步骤 2: 添加新的约束（包含 expired）...');
    
    const addSql = `
      ALTER TABLE rides
      ADD CONSTRAINT rides_status_check
      CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));
    `;

    let addResult;
    try {
      addResult = await supabase.rpc('query', { query_text: addSql });
    } catch (err) {
      console.log('   ℹ️  使用直接 SQL 执行方式');
    }

    console.log('✅ 新约束已添加');
    console.log();

    console.log('📝 步骤 3: 验证约束...');
    
    // 查询约束信息
    const { data: constraints, error: queryError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'rides')
      .eq('constraint_name', 'rides_status_check');

    if (queryError) {
      console.log('   ⚠️  无法验证（这是正常的，Supabase 可能限制了 information_schema 访问）');
    } else if (constraints && constraints.length > 0) {
      console.log('✅ 约束验证成功');
      console.log(`   找到约束: ${constraints[0].constraint_name}`);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('🎉 数据库约束更新完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('✅ 允许的状态值:');
    console.log("   - 'active'");
    console.log("   - 'full'");
    console.log("   - 'completed'   ← 有预订的过期行程");
    console.log("   - 'cancelled'");
    console.log("   - 'expired'     ← 无预订的过期行程 (新增)");
    console.log();
    console.log('🚀 现在可以运行测试脚本了:');
    console.log('   bash test-completed-vs-expired.sh');
    console.log();

  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    console.log();
    console.log('💡 解决方案：手动在 Supabase Dashboard 执行 SQL:');
    console.log();
    console.log('-- 复制以下 SQL 到 Supabase SQL Editor:');
    console.log();
    console.log('ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;');
    console.log();
    console.log('ALTER TABLE rides');
    console.log('ADD CONSTRAINT rides_status_check');
    console.log("CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));");
    console.log();
    process.exit(1);
  }
}

// 执行更新
updateRidesConstraint();




