#!/usr/bin/env node

import { supabaseAdmin } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function viewUsers() {
  console.log('🏫 CampusRide 用户管理系统');
  console.log('=====================================\n');

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`📊 总共 ${users.length} 个注册用户\n`);

    if (users.length === 0) {
      console.log('😐 暂无用户数据');
      return;
    }

    // 表格标题
    console.log('┌─────┬─────────────────────────┬───────────┬─────────────────────┬──────────┬────────┐');
    console.log('│ 序号 │         姓名           │   学号    │        邮箱         │   大学   │  积分  │');
    console.log('├─────┼─────────────────────────┼───────────┼─────────────────────┼──────────┼────────┤');

    users.forEach((user, index) => {
      const name = `${user.first_name} ${user.last_name}`.substring(0, 20).padEnd(20);
      const studentId = user.student_id.substring(0, 9).padEnd(9);
      const email = user.email.substring(0, 19).padEnd(19);
      const university = user.university.substring(0, 8).padEnd(8);
      const points = user.points.toString().padStart(6);
      
      console.log(`│ ${(index + 1).toString().padStart(3)} │ ${name} │ ${studentId} │ ${email} │ ${university} │ ${points} │`);
    });

    console.log('└─────┴─────────────────────────┴───────────┴─────────────────────┴──────────┴────────┘\n');

    // 详细信息
    console.log('📋 详细信息:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   🔑 用户ID: ${user.id}`);
      console.log(`   📧 邮箱: ${user.email}`);
      console.log(`   🆔 学号: ${user.student_id}`);
      console.log(`   🏫 大学: ${user.university}`);
      console.log(`   📚 专业: ${user.major || '未填写'}`);
      console.log(`   🎯 积分: ${user.points}`);
      console.log(`   👤 角色: ${user.role}`);
      console.log(`   ✅ 验证状态: ${user.verification_status}`);
      console.log(`   🕐 注册时间: ${new Date(user.created_at).toLocaleString('zh-CN')}`);
      console.log(`   📱 最后登录: ${user.last_login_date ? new Date(user.last_login_date).toLocaleString('zh-CN') : '从未登录'}`);
    });

  } catch (error) {
    console.error('💥 系统错误:', error.message);
  }
}

viewUsers();