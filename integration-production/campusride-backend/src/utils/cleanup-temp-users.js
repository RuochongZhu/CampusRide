#!/usr/bin/env node

import { supabaseAdmin } from '../config/database.js';

/**
 * 清理临时用户的工具脚本
 * 注意：运行此脚本前请确保备份数据库
 */

// 查找临时用户
async function findTempUsers() {
  try {
    console.log('🔍 Searching for temporary users...');

    const { data: tempUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, email, student_id, first_name, last_name, created_at')
      .or('student_id.like.temp_%,email.like.temp_%@%,password_hash.eq.temp_hash');

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${tempUsers.length} temporary users:`);
    tempUsers.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (${user.student_id})`);
    });

    return tempUsers;
  } catch (error) {
    console.error('❌ Error finding temporary users:', error);
    throw error;
  }
}

// 清理相关数据
async function cleanupUserData(userId) {
  try {
    // 删除用户相关的所有数据
    const tables = [
      'point_transactions',
      'notifications',
      'activity_participants',
      'ride_bookings',
      'item_favorites'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn(`⚠️  Warning: Could not clean ${table} for user ${userId}:`, error.message);
      }
    }

    // 删除用户创建的内容
    const creationTables = [
      { table: 'rides', column: 'driver_id' },
      { table: 'marketplace_items', column: 'seller_id' },
      { table: 'activities', column: 'creator_id' }
    ];

    for (const { table, column } of creationTables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);

      if (error && error.code !== 'PGRST116') {
        console.warn(`⚠️  Warning: Could not clean ${table} for user ${userId}:`, error.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Error cleaning user data for ${userId}:`, error);
    return false;
  }
}

// 删除临时用户
async function deleteTempUsers(userIds, options = { dryRun: true }) {
  try {
    console.log(`${options.dryRun ? '🔍 DRY RUN: Would delete' : '🗑️  Deleting'} ${userIds.length} temporary users...`);

    if (options.dryRun) {
      console.log('ℹ️  This is a dry run. No data will be deleted.');
      console.log('ℹ️  Run with --execute flag to actually delete the data.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      try {
        console.log(`🧹 Cleaning data for user ${userId}...`);
        const cleanupSuccess = await cleanupUserData(userId);

        if (cleanupSuccess) {
          // 删除用户本身
          const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

          if (error) {
            throw error;
          }

          console.log(`✅ Successfully deleted user ${userId}`);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to delete user ${userId}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Cleanup Summary:`);
    console.log(`  ✅ Successfully deleted: ${successCount} users`);
    console.log(`  ❌ Failed to delete: ${errorCount} users`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    const args = process.argv.slice(2);
    const isExecute = args.includes('--execute');

    console.log('🧹 CampusRide Temporary User Cleanup Tool');
    console.log('=========================================\n');

    if (!isExecute) {
      console.log('⚠️  WARNING: This tool will delete temporary users and ALL their associated data!');
      console.log('📋 Running in DRY RUN mode by default.\n');
    }

    const tempUsers = await findTempUsers();

    if (tempUsers.length === 0) {
      console.log('🎉 No temporary users found. Database is clean!');
      return;
    }

    const userIds = tempUsers.map(user => user.id);
    await deleteTempUsers(userIds, { dryRun: !isExecute });

    if (!isExecute) {
      console.log('\n💡 To actually delete the temporary users, run:');
      console.log('   node src/utils/cleanup-temp-users.js --execute');
    }

  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { findTempUsers, deleteTempUsers, cleanupUserData };