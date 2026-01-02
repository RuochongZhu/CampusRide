import { supabaseAdmin } from '../src/config/database.js';

/**
 * 添加 dislikes_count 列到 marketplace_comments 表
 */
async function addDislikesColumn() {
  console.log('🔧 Starting migration: Add dislikes_count column to marketplace_comments');

  try {
    // 直接尝试添加列，如果存在会被忽略
    const { data, error } = await supabaseAdmin
      .from('marketplace_comments')
      .select('dislikes_count')
      .limit(1);

    if (!error) {
      console.log('✅ Column dislikes_count already exists');
      return;
    }

    // 如果查询失败，说明列不存在，需要添加
    console.log('📝 Adding dislikes_count column...');

    // 使用原生SQL添加列
    const { error: alterError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        ALTER TABLE marketplace_comments
        ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0 NOT NULL;
      `
    });

    if (alterError) {
      console.error('❌ Error adding dislikes_count column:', alterError);

      // 尝试备用方法
      console.log('🔄 Trying alternative method...');
      const client = supabaseAdmin;
      const { error: directError } = await client
        .schema('public')
        .rpc('sql', {
          query: 'ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0 NOT NULL;'
        });

      if (directError) {
        console.error('❌ Alternative method also failed:', directError);
        return;
      }
    }

    console.log('✅ Successfully added dislikes_count column');

    // 验证列已添加
    const { data: testData, error: testError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('dislikes_count')
      .limit(1);

    if (!testError) {
      console.log('✅ Column verification successful');
    } else {
      console.log('⚠️ Column verification failed:', testError);
    }

    console.log('🎉 Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// 运行迁移
addDislikesColumn();