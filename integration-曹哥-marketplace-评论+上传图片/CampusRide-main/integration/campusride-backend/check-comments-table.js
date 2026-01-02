import { supabaseAdmin } from './src/config/database.js';

async function checkCommentsTable() {
  console.log('🔍 Checking marketplace_comments table...\n');

  // 1. 检查表是否存在
  console.log('Step 1: Check if table exists');
  const { data: tables, error: tablesError } = await supabaseAdmin
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'marketplace_comments');

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError);
  } else {
    console.log('✅ Table exists:', tables);
  }

  // 2. 检查表结构
  console.log('\nStep 2: Check table structure');
  const { data: columns, error: columnsError } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'marketplace_comments');

  if (columnsError) {
    console.error('❌ Error checking columns:', columnsError);
  } else {
    console.log('✅ Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
  }

  // 3. 尝试插入测试数据
  console.log('\nStep 3: Test insert');
  const testComment = {
    item_id: '6bcca951-2e46-429e-ab14-f291589d790f',  // 使用实际存在的item ID
    user_id: '0d7cf564-1e6d-4772-a550-1bf607420269',  // 使用实际存在的user ID
    content: 'Test comment'
  };

  const { data: insertedComment, error: insertError } = await supabaseAdmin
    .from('marketplace_comments')
    .insert(testComment)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    console.error('Error details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Insert successful:', insertedComment);

    // 清理测试数据
    await supabaseAdmin
      .from('marketplace_comments')
      .delete()
      .eq('id', insertedComment.id);
    console.log('✅ Test comment deleted');
  }

  // 4. 检查外键约束
  console.log('\nStep 4: Check foreign key constraints');
  const { data: constraints, error: constraintsError } = await supabaseAdmin
    .from('information_schema.table_constraints')
    .select('constraint_name, constraint_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'marketplace_comments');

  if (constraintsError) {
    console.error('❌ Error checking constraints:', constraintsError);
  } else {
    console.log('✅ Table constraints:');
    constraints.forEach(con => {
      console.log(`  - ${con.constraint_name}: ${con.constraint_type}`);
    });
  }
}

checkCommentsTable()
  .catch(console.error)
  .finally(() => process.exit());
