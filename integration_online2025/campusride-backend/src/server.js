#!/usr/bin/env node

import app from './app.js';
import { validateDatabase, initializeDatabase, createSampleData } from './utils/database-init.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 Starting CampusRide Backend Server...');
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // 验证环境变量
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
      console.error('📝 Please copy .env.example to .env and fill in the values');
      process.exit(1);
    }

    // 验证数据库连接
    console.log('🔍 Validating database connection...');
    await validateDatabase();

    // 在开发环境下可选择初始化数据库
    if (process.env.NODE_ENV === 'development' && process.env.INIT_DATABASE === 'true') {
      console.log('🔄 Initializing database schema...');
      await initializeDatabase();
      
      if (process.env.CREATE_SAMPLE_DATA === 'true') {
        console.log('📝 Creating sample data...');
        await createSampleData();
      }
    }

    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎉 CampusRide Backend Server is running!');
      console.log('');
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔧 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log('');
      console.log('🌟 Available API Endpoints:');
      console.log('   Authentication: /api/v1/auth/*');
      console.log('   Users:         /api/v1/users/*');
      console.log('   Leaderboard:   /api/v1/leaderboard/*');
      console.log('   Rideshare:     /api/v1/rideshare/*');
      console.log('   Marketplace:   /api/v1/marketplace/*');
      console.log('   Activities:    /api/v1/activities/*');
      console.log('   Points:        /api/v1/points/*');
      console.log('   Notifications: /api/v1/notifications/*');
      console.log('');
      console.log('🚦 Press Ctrl+C to stop the server');
      console.log('');
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // 关闭服务器
        await new Promise((resolve) => {
          server.close(() => {
            console.log('✅ HTTP server closed');
            resolve();
          });
        });

        // 关闭Socket.io连接
        if (global.socketManager) {
          await global.socketManager.shutdown();
        }

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default startServer; 