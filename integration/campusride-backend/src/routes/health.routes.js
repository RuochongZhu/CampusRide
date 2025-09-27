import express from 'express';
import { testConnection } from '../config/database.js';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        server: 'running'
      },
      version: '1.0.0'
    };

    res.status(200).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Health check failed'
      },
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router; 