// 简单版本：直接执行 SQL 更新约束
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env') });

// 从 Supabase URL 构建 PostgreSQL 连接字符串
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ 缺少 SUPABASE_URL');
  process.exit(1);
}

// 提取项目 ID
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('❌ 无法从 SUPABASE_URL 提取项目 ID');
  process.exit(1);
}

// 构建 PostgreSQL 连接字符串
// 注意：你需要从 Supabase Dashboard → Settings → Database 获取数据库密码
console.log('⚠️  这个脚本需要直接的数据库连接');
console.log();
console.log('由于 Supabase 的安全限制，请手动执行以下 SQL:');
console.log();
console.log('=' .repeat(70));
console.log('📋 复制以下 SQL 到 Supabase Dashboard → SQL Editor:');
console.log('=' .repeat(70));
console.log();
console.log('-- 1. 删除旧约束');
console.log('ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;');
console.log();
console.log('-- 2. 添加新约束（包含 expired）');
console.log('ALTER TABLE rides');
console.log('ADD CONSTRAINT rides_status_check');
console.log("CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));");
console.log();
console.log('-- 3. 验证');
console.log('SELECT');
console.log('    conname AS constraint_name,');
console.log('    pg_get_constraintdef(oid) AS constraint_definition');
console.log('FROM pg_constraint');
console.log("WHERE conrelid = 'rides'::regclass");
console.log("AND conname = 'rides_status_check';");
console.log();
console.log('=' .repeat(70));
console.log();
console.log('🔗 快速链接:');
console.log(`   https://supabase.com/dashboard/project/${projectId}/sql`);
console.log();
console.log('📝 执行步骤:');
console.log('   1. 打开上面的链接');
console.log('   2. 复制上面的 SQL');
console.log('   3. 粘贴到 SQL Editor');
console.log('   4. 点击 "RUN" 按钮');
console.log('   5. 看到 "Success. No rows returned" 就成功了');
console.log();




