import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import healthRoutes from './routes/health.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import pointsRoutes from './routes/points.routes.js';
import activityRoutes from './routes/activity.routes.js';
import rideshareRoutes from './routes/rideshare.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import groupRoutes from './routes/group.routes.js';
import thoughtRoutes from './routes/thought.routes.js';
import visibilityRoutes from './routes/visibility.routes.js';
import carpoolingRoutes from './routes/carpooling.routes.js';
import ratingRoutes from './routes/rating.routes.js';

// Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';

// Import Socket.io manager
import socketManager from './config/socket.js';

// Import Swagger documentation
import { swaggerUi, specs } from './config/swagger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - support multiple frontend URLs
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CampusRide API Documentation'
}));

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/points', pointsRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/rideshare', rideshareRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/thoughts', thoughtRoutes);
app.use('/api/v1/visibility', visibilityRoutes);
app.use('/api/v1/carpooling', carpoolingRoutes);
app.use('/api/v1/ratings', ratingRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CampusRide API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Create HTTP server and initialize Socket.IO
const server = createServer(app);

// Initialize Socket.IO
let socketInitialized = false;

const initializeSocket = async () => {
  if (!socketInitialized && process.env.NODE_ENV !== 'test') {
    try {
      await socketManager.initialize(server);
      socketInitialized = true;
      console.log('🔄 Socket.IO initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
    }
  }
};

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, async () => {
    console.log(`🚀 CampusRide API server running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    
    // Initialize Socket.IO after server starts
    await initializeSocket();
  });
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n👋 Gracefully shutting down server...');
  
  try {
    await socketManager.shutdown();
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

export default app;
export { socketManager }; 