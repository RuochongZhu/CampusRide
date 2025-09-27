#!/usr/bin/env node

import { supabaseAdmin } from '../src/config/database.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function clearUserData() {
  console.log('🗑️  开始清空用户数据...\n');

  try {
    // 按照外键依赖关系的顺序清空表（从依赖表到主表）
    const tables = [
      // 最深层的依赖表
      'file_uploads',
      'messages', 
      'notifications',
      'leaderboard_entries',
      'point_transactions',
      'activity_participants',
      'reviews',
      'item_favorites',
      'ride_bookings',
      
      // 中层依赖表
      'marketplace_items',
      'activities',
      'rides',
      'vehicles',
      
      // 最后清空用户表
      'users'
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      console.log(`📋 清空表: ${table}`);
      
      // 获取当前记录数
      const { count: beforeCount, error: countError } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ 无法获取表 ${table} 的记录数:`, countError.message);
        continue;
      }

      if (beforeCount === 0) {
        console.log(`✅ 表 ${table} 已经为空\n`);
        continue;
      }

      // 删除所有记录
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录的技巧

      if (deleteError) {
        console.log(`❌ 清空表 ${table} 失败:`, deleteError.message);
        continue;
      }

      console.log(`✅ 表 ${table} 清空完成 (删除了 ${beforeCount} 条记录)\n`);
      totalDeleted += beforeCount;
    }

    console.log(`🎉 所有用户数据清空完成！总共删除了 ${totalDeleted} 条记录`);
    
    // 保留积分规则表的基础数据
    console.log('\n📝 注意: point_rules 表保留基础配置数据，未被清空');

  } catch (error) {
    console.error('❌ 清空数据时发生错误:', error);
    process.exit(1);
  }
}

// 确认提示
async function confirmClear() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  确定要清空所有用户数据吗？这个操作不可撤销！(输入 "yes" 确认): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// 主函数
async function main() {
  if (process.argv.includes('--force')) {
    // 强制执行，跳过确认
    await clearUserData();
  } else {
    // 需要用户确认
    const confirmed = await confirmClear();
    if (confirmed) {
      await clearUserData();
    } else {
      console.log('❌ 操作已取消');
    }
  }
  
  process.exit(0);
}

main().catch(console.error);