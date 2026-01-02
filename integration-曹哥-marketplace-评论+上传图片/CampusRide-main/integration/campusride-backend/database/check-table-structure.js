import { supabaseAdmin } from '../src/config/database.js';

/**
 * 检查marketplace_comments表的实际结构
 */
async function checkTableStructure() {
  console.log('🔍 Checking actual table structure for marketplace_comments...');

  try {
    // 通过查询information_schema获取表结构
    const { data, error } = await supabaseAdmin.rpc('sql', {
      query: `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'marketplace_comments'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    }).single();

    if (error) {
      console.log('❌ RPC function not available, trying direct query...');

      // 尝试直接查询表来推断结构
      const { data: sampleData, error: sampleError } = await supabaseAdmin
        .from('marketplace_comments')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Error accessing table:', sampleError);
        return;
      }

      console.log('📋 Sample data structure:', JSON.stringify(sampleData, null, 2));
    } else {
      console.log('📋 Table structure:', data);
    }

    // 尝试查询每个预期的列
    console.log('\n🔍 Testing individual columns...');
    const expectedColumns = [
      'id', 'item_id', 'user_id', 'parent_id', 'content',
      'images', 'is_edited', 'likes_count', 'dislikes_count',
      'replies_count', 'created_at', 'updated_at'
    ];

    for (const column of expectedColumns) {
      try {
        const { error } = await supabaseAdmin
          .from('marketplace_comments')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Column '${column}' does NOT exist:`, error.message);
        } else {
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}' test failed:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Structure check failed:', error);
  }
}

// 运行检查
checkTableStructure();