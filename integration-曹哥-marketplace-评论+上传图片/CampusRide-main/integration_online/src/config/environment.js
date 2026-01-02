// 环境配置
const env = {
  // 开发环境
  development: {
    apiUrl: 'http://localhost:3001',
  },
  // 生产环境
  production: {
    apiUrl: 'https://campusride-production.up.railway.app',
  },
};

// 智能检测环境
function detectEnvironment() {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('✅ Using VITE_API_BASE_URL from environment');
    return null; // 将直接使用环境变量
  }

  // 根据当前域名判断
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 生产域名
    if (hostname === 'campusgo.college' || hostname === 'www.campusgo.college') {
      console.log('🌍 Detected production environment from domain');
      return 'production';
    }

    // 本地开发
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('💻 Detected development environment from domain');
      return 'development';
    }
  }

  // 尝试使用Vite的MODE
  if (import.meta.env.MODE) {
    console.log('🔧 Using MODE from import.meta.env:', import.meta.env.MODE);
    return import.meta.env.MODE;
  }

  // 默认生产环境（安全选择）
  console.log('⚠️ Using default production environment');
  return 'production';
}

const currentEnv = detectEnvironment();

// 如果有环境变量直接使用，否则使用配置
export const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL || (currentEnv ? env[currentEnv]?.apiUrl : env.production.apiUrl)
};

// 调试信息
console.log('🌍 Environment:', currentEnv || 'auto-detect');
console.log('🔧 API URL:', config.apiUrl);
console.log('🔧 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🔧 MODE:', import.meta.env.MODE);

export default config;
