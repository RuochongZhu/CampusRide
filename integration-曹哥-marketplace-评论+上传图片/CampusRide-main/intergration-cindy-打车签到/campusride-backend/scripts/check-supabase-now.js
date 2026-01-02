import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;

console.log('🔍 检查 Supabase 项目状态...\n');
console.log('📍 项目 URL:', SUPABASE_URL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY
    }
  });

  console.log('✅ 收到响应!');
  console.log('📊 HTTP 状态码:', response.status);
  console.log('📋 状态文本:', response.statusText);
  
  if (response.ok || response.status === 401 || response.status === 404) {
    console.log('\n🎉 太好了！Supabase 项目已经可以访问了！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 下一步：创建数据库表');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('运行以下命令：');
    console.log('1️⃣ node scripts/create-tables.js');
    console.log('2️⃣ node scripts/create-demo-user.js\n');
    process.exit(0);
  } else {
    console.log('\n⏳ 项目正在初始化，请稍等片刻...\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ 无法连接到 Supabase');
  console.log('错误:', error.message);
  
  if (error.cause?.code === 'ENOTFOUND') {
    console.log('\n⏳ 项目还在初始化中...');
    console.log('💡 这是正常的！新创建的 Supabase 项目需要 2-5 分钟才能就绪。');
    console.log('\n📋 建议：');
    console.log('1. 等待 2-3 分钟');
    console.log('2. 再次运行: node scripts/check-supabase-now.js');
    console.log('3. 或者在浏览器打开 Supabase Dashboard 查看项目状态\n');
  } else {
    console.log('\n💡 检查：');
    console.log('1. 网络连接是否正常');
    console.log('2. Supabase URL 是否正确');
    console.log('3. 项目是否已激活\n');
  }
  
  process.exit(1);
}


