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

// 自动检测环境
const currentEnv = import.meta.env.MODE || 'production';

// 导出当前环境的配置
export const config = env[currentEnv] || env.production;

// 调试信息
console.log('🌍 Environment:', currentEnv);
console.log('🔧 API URL:', config.apiUrl);
console.log('🔧 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

export default config;
