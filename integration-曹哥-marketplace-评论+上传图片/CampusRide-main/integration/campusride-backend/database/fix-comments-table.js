import { supabaseAdmin } from '../src/config/database.js';

/**
 * 完整的评论表结构修复脚本
 * 添加所有缺失的列
 */
async function fixCommentsTableStructure() {
  console.log('🔧 Starting comprehensive marketplace_comments table fix...');

  const missingColumns = [
    {
      name: 'parent_id',
      type: 'UUID',
      nullable: true,
      references: 'marketplace_comments(id)',
      description: 'For threaded comments/replies'
    },
    {
      name: 'images',
      type: 'TEXT[]',
      nullable: true,
      description: 'Array of image URLs'
    },
    {
      name: 'is_edited',
      type: 'BOOLEAN',
      default: 'false',
      description: 'Track if comment was edited'
    },
    {
      name: 'dislikes_count',
      type: 'INTEGER',
      default: '0',
      description: 'Number of dislikes'
    },
    {
      name: 'replies_count',
      type: 'INTEGER',
      default: '0',
      description: 'Number of replies'
    }
  ];

  try {
    for (const column of missingColumns) {
      console.log(`📝 Adding column: ${column.name} (${column.description})`);

      // 构建ALTER TABLE语句
      let sql = `ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`;

      if (column.default) {
        sql += ` DEFAULT ${column.default}`;
      }

      if (column.nullable === false) {
        sql += ` NOT NULL`;
      }

      sql += ';';

      console.log(`   SQL: ${sql}`);

      // 尝试使用不同的方法执行SQL
      let success = false;

      // 方法1: 尝试通过插入一个测试记录来触发错误，然后处理
      try {
        // 先测试列是否存在
        const { error: testError } = await supabaseAdmin
          .from('marketplace_comments')
          .select(column.name)
          .limit(1);

        if (testError && testError.message.includes('does not exist')) {
          console.log(`   ❌ Column ${column.name} confirmed missing`);

          // 尝试通过数据库函数执行
          const { data, error } = await supabaseAdmin.rpc('exec', {
            sql: sql
          });

          if (!error) {
            console.log(`   ✅ Successfully added ${column.name} via exec`);
            success = true;
          }
        } else if (!testError) {
          console.log(`   ✅ Column ${column.name} already exists`);
          success = true;
        }
      } catch (err) {
        console.log(`   ⚠️ Standard method failed: ${err.message}`);
      }

      if (!success) {
        console.log(`   🔄 Trying alternative approach for ${column.name}...`);

        // 方法2: 创建一个新的临时表并迁移数据
        try {
          const tempTableName = `marketplace_comments_temp_${Date.now()}`;

          const createTempTableSQL = `
            CREATE TABLE ${tempTableName} AS
            SELECT *,
              ${column.type === 'UUID' ? 'NULL' : column.type === 'TEXT[]' ? 'ARRAY[]::TEXT[]' : column.type === 'BOOLEAN' ? (column.default || 'false') : (column.default || '0')} as ${column.name}
            FROM marketplace_comments;
          `;

          console.log(`   Creating temp table: ${createTempTableSQL}`);
          // 这种方法需要直接数据库访问，暂时跳过
          console.log(`   ⚠️ Temp table method requires direct DB access, skipping for now`);
        } catch (tempErr) {
          console.log(`   ❌ Temp table method failed: ${tempErr.message}`);
        }
      }
    }

    // 验证修复结果
    console.log('\n🔍 Verifying table structure after fixes...');
    for (const column of missingColumns) {
      try {
        const { error } = await supabaseAdmin
          .from('marketplace_comments')
          .select(column.name)
          .limit(1);

        if (error) {
          console.log(`❌ ${column.name}: Still missing`);
        } else {
          console.log(`✅ ${column.name}: Successfully added`);
        }
      } catch (err) {
        console.log(`❌ ${column.name}: Verification failed`);
      }
    }

    console.log('\n🎉 Table structure fix completed');

  } catch (error) {
    console.error('❌ Table fix failed:', error);
  }
}

// 运行修复
fixCommentsTableStructure();