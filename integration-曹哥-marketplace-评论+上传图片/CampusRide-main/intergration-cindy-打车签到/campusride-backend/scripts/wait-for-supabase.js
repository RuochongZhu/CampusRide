import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const MAX_ATTEMPTS = 30; // 最多等待 5 分钟（每次 10 秒）
const DELAY = 10000; // 10 秒

let attempt = 0;

const checkSupabase = async () => {
  attempt++;
  
  console.log(`\n🔍 检查 ${attempt}/${MAX_ATTEMPTS} - ${new Date().toLocaleTimeString()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });

    if (response.ok || response.status === 401 || response.status === 404) {
      // 401 或 404 都说明 API 是可访问的
      console.log('✅ Supabase 项目已就绪！');
      console.log(`📊 状态码: ${response.status}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 太好了！现在可以继续设置了！');
      console.log('\n📋 下一步：');
      console.log('1️⃣ 创建数据库表：node scripts/create-tables.js');
      console.log('2️⃣ 创建测试账号：node scripts/create-demo-user.js');
      console.log('3️⃣ 重启后端服务器');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return true;
    }
    
    console.log(`⏳ 项目还在初始化中... (状态码: ${response.status})`);
    return false;
  } catch (error) {
    if (error.cause?.code === 'ENOTFOUND') {
      console.log('⏳ DNS 还未生效，项目正在初始化...');
      console.log('💡 这是正常的，新项目需要几分钟时间');
    } else {
      console.log('⏳ 正在等待项目启动...');
    }
    
    // 显示进度条
    const progress = Math.floor((attempt / MAX_ATTEMPTS) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    console.log(`进度: [${bar}] ${Math.floor((attempt / MAX_ATTEMPTS) * 100)}%`);
    
    return false;
  }
};

const waitForSupabase = async () => {
  console.log('🚀 等待 Supabase 项目初始化...\n');
  console.log('📍 项目 URL:', SUPABASE_URL);
  console.log('⏱️  预计时间: 2-5 分钟');
  console.log('🔄 每 10 秒检查一次');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 提示: 您可以随时按 Ctrl+C 停止等待\n');

  while (attempt < MAX_ATTEMPTS) {
    const ready = await checkSupabase();
    
    if (ready) {
      process.exit(0);
    }
    
    if (attempt < MAX_ATTEMPTS) {
      console.log(`⏳ ${DELAY / 1000} 秒后再次检查...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏱️  等待超时 (5 分钟)');
  console.log('\n🔍 可能的原因：');
  console.log('1. Supabase 服务器负载较高');
  console.log('2. 网络连接问题');
  console.log('3. 项目配置有问题');
  console.log('\n💡 建议：');
  console.log('1. 在浏览器中打开 Supabase Dashboard');
  console.log('2. 检查项目状态是否为 "Active"');
  console.log('3. 确认 Project URL 是否正确');
  console.log('4. 稍后再试或使用演示模式');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  process.exit(1);
};

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n⚠️  检查已取消');
  console.log('💡 您可以随时重新运行此脚本');
  process.exit(0);
});

waitForSupabase();


