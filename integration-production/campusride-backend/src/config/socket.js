import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './database.js';

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> user info
  }

  async initialize(server) {
    try {
      // Allow multiple frontend origins for CORS
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      this.io = new Server(server, {
        cors: {
          origin: allowedOrigins,
          methods: ['GET', 'POST'],
          credentials: true
        }
      });

      // Authentication middleware
      this.io.use(async (socket, next) => {
        try {
          const token = socket.handshake.auth.token;
          console.log('🔐 Socket auth attempt, token present:', !!token);

          if (!token) {
            console.error('❌ Socket auth: No token provided');
            return next(new Error('Authentication token required'));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('✅ JWT decoded, userId:', decoded.userId, 'type:', decoded.type);

          // Handle guest users - allow connection but with limited capabilities
          if (decoded.type === 'guest' || decoded.userId === 'guest') {
            socket.userId = 'guest';
            socket.user = {
              id: 'guest',
              email: 'guest@example.com',
              first_name: 'Guest',
              last_name: 'User',
              university: 'Cornell University',
              role: 'guest',
              isGuest: true
            };
            console.log('✅ Socket auth successful for guest user');
            return next();
          }

          // Get user from database
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, university, role')
            .eq('id', decoded.userId)
            .single();

          if (error) {
            console.error('❌ Socket auth: Database error:', error.message);
            return next(new Error('Invalid user'));
          }

          if (!user) {
            console.error('❌ Socket auth: User not found for id:', decoded.userId);
            return next(new Error('Invalid user'));
          }

          socket.userId = user.id;
          socket.user = user;
          console.log('✅ Socket auth successful for:', user.email);
          next();
        } catch (error) {
          console.error('❌ Socket auth exception:', error.message);
          next(new Error('Authentication failed'));
        }
      });

      // Handle connections
      this.io.on('connection', (socket) => {
        this.handleConnection(socket);
      });

      console.log('✅ Socket.IO initialized successfully');
    } catch (error) {
      console.error('❌ Socket.IO initialization failed:', error);
      throw error;
    }
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, { userId, user });

    // Join user to personal room
    socket.join(`user:${userId}`);

    console.log(`📱 User ${user.first_name} connected (${socket.id})`);

    // Broadcast user online status
    this.broadcastOnlineUsers();
    this.io.emit('user_online', userId);

    // Handle events
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('join_activity', (activityId) => {
      socket.join(`activity:${activityId}`);
      console.log(`🎯 User ${userId} joined activity ${activityId}`);
    });

    socket.on('leave_activity', (activityId) => {
      socket.leave(`activity:${activityId}`);
      console.log(`👋 User ${userId} left activity ${activityId}`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle message thread joining
    socket.on('join_message_thread', (threadId) => {
      socket.join(`thread:${threadId}`);
      console.log(`💬 User ${userId} joined message thread ${threadId}`);
    });

    // Handle message thread leaving
    socket.on('leave_message_thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
      console.log(`👋 User ${userId} left message thread ${threadId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ threadId, userId: typingUserId, isTyping }) => {
      // Broadcast to thread (except sender)
      socket.to(`thread:${threadId}`).emit('typing_indicator', {
        userId: typingUserId,
        isTyping
      });
      console.log(`⌨️ User ${typingUserId} ${isTyping ? 'is typing' : 'stopped typing'} in thread ${threadId}`);
    });

    // Send current online users to newly connected user
    socket.emit('online_users', Array.from(this.connectedUsers.keys()));
  }

  handleDisconnect(socket) {
    const userId = socket.userId;
    const user = socket.user;

    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);

    // Broadcast user offline status
    this.io.emit('user_offline', userId);

    console.log(`📱 User ${user?.first_name || 'Unknown'} disconnected (${socket.id})`);
  }

  // Broadcast online users list
  broadcastOnlineUsers() {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    this.io.emit('online_users', onlineUserIds);
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const room = `user:${userId}`;
    this.io.to(room).emit('notification', notification);
  }

  // Send notification to activity participants
  sendNotificationToActivity(activityId, notification) {
    const room = `activity:${activityId}`;
    this.io.to(room).emit('activity_notification', notification);
  }

  // Broadcast to all connected users
  broadcastNotification(notification) {
    this.io.emit('broadcast_notification', notification);
  }

  // Send rideshare update
  sendRideshareUpdate(rideId, update) {
    this.io.to(`ride:${rideId}`).emit('rideshare_update', update);
  }

  // Send marketplace update
  sendMarketplaceUpdate(itemId, update) {
    this.io.to(`marketplace:${itemId}`).emit('marketplace_update', update);
  }

  // Send message to thread participants
  sendMessageToThread(threadId, message) {
    this.io.to(`thread:${threadId}`).emit('new_message', message);
    console.log(`💬 Message sent to thread ${threadId}`);
  }

  // Send typing indicator to thread
  sendTypingToThread(threadId, userId, isTyping) {
    this.io.to(`thread:${threadId}`).emit('typing_indicator', { userId, isTyping });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get all online user IDs
  getOnlineUserIds() {
    return Array.from(this.connectedUsers.keys());
  }

  async shutdown() {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      this.userSockets.clear();
      console.log('✅ Socket.IO shutdown complete');
    }
  }
}

const socketManager = new SocketManager();
export default socketManager;