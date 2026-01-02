import express from 'express';
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
import messageRoutes from './routes/message.routes.js';
import activityCheckinRoutes from './routes/activity-checkin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import userProfileRoutes from './routes/user-profile.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import adminRoutes from './routes/admin.routes.js';
import announcementRoutes from './routes/announcement.routes.js';

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

// Security middleware
app.use(helmet());

// CORS configuration - support multiple frontend URLs
const frontendUrlsFromEnv = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : [];

const devOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3003'
];

const allowedOrigins = [...new Set([...frontendUrlsFromEnv, ...devOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increase limit to 500 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1', activityCheckinRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/users', userProfileRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

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

export default app;
export { socketManager }; 
