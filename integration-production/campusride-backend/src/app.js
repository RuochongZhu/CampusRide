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
import webhookRoutes from './routes/webhook.routes.js';

// Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';

// Import Socket.io manager
import socketManager from './config/socket.js';

// Import Swagger documentation
import { swaggerUi, specs } from './config/swagger.js';
import { supabaseAdmin } from './config/database.js';

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
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5176',
  'http://localhost:5177',
  'http://127.0.0.1:5177',
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
app.use('/api/v1/webhook', webhookRoutes);

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

// New GET endpoint for 1Dj025lEVj.txt
app.get('/1Dj025lEVj.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('c82801c84003105ee7094936dbfd7f16');
});

app.get("/wxgroup_notice_wait", async (req, res) => {
  try {
    // 查询 wxgroup_notice_record 表，获取 sendtime 为空的记录
    const { data: notices, error } = await supabaseAdmin
      .from('wxgroup_notice_record')
      .select('id, content, created_at')
      .is('sendtime', null)
      .order('created_at', { ascending: true }); // 按创建时间升序，先处理旧记录

    if (error) {
      console.error('Error fetching wxgroup notices:', error);
      res.set('Content-Type', 'text/plain');
      res.send('');
      return;
    }

    if (!notices || notices.length === 0) {
      // 如果没有找到记录，返回空文本
      res.set('Content-Type', 'text/plain');
      res.send('');
      return;
    }

    const now = new Date();
    const currentTime = getNewYorkTimestamp(now);
    const selectedNotices = selectNoticeBatch(notices, now);

    if (!selectedNotices.length) {
      res.set('Content-Type', 'text/plain');
      res.send('');
      return;
    }

    // 更新选中记录的 sendtime 为当前时间
    const selectedIds = selectedNotices.map(n => n.id);
    await supabaseAdmin
      .from('wxgroup_notice_record')
      .update({ sendtime: currentTime })
      .in('id', selectedIds);

    // 合并消息内容
    const mergedContent = selectedNotices
      .map((n, idx) => `${idx + 1}. ${n.content}`)
      .join('\n\n');

    res.set('Content-Type', 'text/plain');
    res.send(mergedContent);
  } catch (error) {
    console.error('Error in wxgroup_notice_wait endpoint:', error);
    res.set('Content-Type', 'text/plain');
    res.send('');
  }
})

// v2: 返回可确认的批次，客户端确认后才写入 sendtime
app.get("/wxgroup_notice_wait_v2", async (req, res) => {
  try {
    const { data: notices, error } = await supabaseAdmin
      .from('wxgroup_notice_record')
      .select('id, content, created_at')
      .is('sendtime', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching wxgroup notices (v2):', error);
      return res.json({ success: false, data: null });
    }

    if (!notices || notices.length === 0) {
      return res.json({ success: true, data: null });
    }

    const now = new Date();
    const selectedNotices = selectNoticeBatch(notices, now);

    if (!selectedNotices.length) {
      return res.json({ success: true, data: null });
    }

    const mergedContent = selectedNotices
      .map((n, idx) => `${idx + 1}. ${n.content}`)
      .join('\n\n');

    return res.json({
      success: true,
      data: {
        ids: selectedNotices.map(n => n.id),
        count: selectedNotices.length,
        content: mergedContent
      }
    });
  } catch (error) {
    console.error('Error in wxgroup_notice_wait_v2 endpoint:', error);
    return res.json({ success: false, data: null });
  }
});

// v2: 客户端确认已发送后写入 sendtime（纽约时区）
app.post("/wxgroup_notice_ack", express.json(), async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'ids required' });
    }

    const currentTime = getNewYorkTimestamp(new Date());
    await supabaseAdmin
      .from('wxgroup_notice_record')
      .update({ sendtime: currentTime })
      .in('id', ids);

    return res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error in wxgroup_notice_ack endpoint:', error);
    return res.status(500).json({ success: false });
  }
});

function getNewYorkTimestamp(date) {
  // Format as ISO-like string with NY offset, e.g. 2026-02-13T08:30:00-05:00
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find(p => p.type === type)?.value;
  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const mi = get('minute');
  const ss = get('second');

  const tzName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset'
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'GMT-00:00';

  const offset = tzName.replace('GMT', '');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${offset}`;
}

function selectNoticeBatch(notices, now) {
  const batchSize = 5;
  const dayMs = 24 * 60 * 60 * 1000;
  const oldestNotice = notices[0];
  const oldestCreatedAt = new Date(oldestNotice.created_at || now.toISOString());
  const ageMs = now.getTime() - oldestCreatedAt.getTime();

  if (notices.length >= batchSize) {
    return notices.slice(0, batchSize);
  }
  if (ageMs >= dayMs) {
    return notices.slice();
  }
  return [];
}

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
export { socketManager }; 
