import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearMarketplaceData() {
  console.log('开始清空二手板块数据...\n');

  try {
    // 1. 先删除 marketplace_comments (因为有外键依赖于 marketplace_items)
    console.log('1. 清空商品评论表 (marketplace_comments)...');
    const { error: commentError } = await supabaseAdmin
      .from('marketplace_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (commentError) {
      console.error('清空评论表失败:', commentError.message);
    } else {
      console.log('   ✅ 评论表已清空');
    }

    // 2. 删除 item_favorites (因为有外键依赖于 marketplace_items)
    console.log('2. 清空商品收藏表 (item_favorites)...');
    const { error: favError } = await supabaseAdmin
      .from('item_favorites')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (favError) {
      console.error('清空收藏表失败:', favError.message);
    } else {
      console.log('   ✅ 收藏表已清空');
    }

    // 3. 删除 marketplace_items
    console.log('3. 清空商品表 (marketplace_items)...');
    const { error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (itemError) {
      console.error('清空商品表失败:', itemError.message);
    } else {
      console.log('   ✅ 商品表已清空');
    }

    // 4. 验证清空结果
    console.log('\n4. 验证清空结果...');

    const { count: itemCount } = await supabaseAdmin
      .from('marketplace_items')
      .select('*', { count: 'exact', head: true });

    const { count: favCount } = await supabaseAdmin
      .from('item_favorites')
      .select('*', { count: 'exact', head: true });

    const { count: commentCount } = await supabaseAdmin
      .from('marketplace_comments')
      .select('*', { count: 'exact', head: true });

    console.log(`   marketplace_items 剩余记录: ${itemCount || 0}`);
    console.log(`   item_favorites 剩余记录: ${favCount || 0}`);
    console.log(`   marketplace_comments 剩余记录: ${commentCount || 0}`);

    console.log('\n✅ 二手板块数据清空完成！表结构保持不变。');

  } catch (error) {
    console.error('执行出错:', error.message);
    process.exit(1);
  }
}

clearMarketplaceData();
