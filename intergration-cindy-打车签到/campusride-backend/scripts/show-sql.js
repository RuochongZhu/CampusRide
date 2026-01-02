// 显示需要执行的 SQL
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const projectId = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('=' .repeat(70));
console.log('📋 需要在 Supabase Dashboard 执行的 SQL');
console.log('=' .repeat(70));
console.log();
console.log('-- 复制以下 3 行 SQL：');
console.log();
console.log('ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;');
console.log();
console.log('ALTER TABLE rides ADD CONSTRAINT rides_status_check');
console.log("CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));");
console.log();
console.log('=' .repeat(70));
console.log();

if (projectId) {
  console.log('🔗 Supabase SQL Editor 直接链接:');
  console.log(`   https://supabase.com/dashboard/project/${projectId}/sql`);
  console.log();
}

console.log('📝 执行步骤:');
console.log('   1. 打开 Supabase Dashboard');
console.log('   2. 点击左侧 "SQL Editor"');
console.log('   3. 点击 "New query"');
console.log('   4. 粘贴上面的 SQL');
console.log('   5. 点击 "RUN" (或按 Cmd/Ctrl + Enter)');
console.log('   6. 看到 "Success" 就完成了');
console.log();
console.log('✅ 执行后允许的状态值:');
console.log("   - 'active'      (进行中)");
console.log("   - 'full'        (已满员)");
console.log("   - 'completed'   (已完成 - 有预订)");
console.log("   - 'cancelled'   (已取消)");
console.log("   - 'expired'     (已过期 - 无预订) ← 新增");
console.log();







