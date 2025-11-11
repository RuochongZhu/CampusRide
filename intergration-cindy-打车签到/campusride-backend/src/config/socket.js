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
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:5173',
          methods: ['GET', 'POST'],
          credentials: true
        }
      });

      // Authentication middleware
      this.io.use(async (socket, next) => {
        try {
          const token = socket.handshake.auth.token;
          if (!token) {
            return next(new Error('Authentication token required'));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Get user from database
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, university, role, is_active')
            .eq('id', decoded.userId)
            .single();

          if (error || !user || !user.is_active) {
            return next(new Error('Invalid user'));
          }

          socket.userId = user.id;
          socket.user = user;
          next();
        } catch (error) {
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
  }

  handleDisconnect(socket) {
    const userId = socket.userId;
    const user = socket.user;

    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);

    console.log(`📱 User ${user?.first_name || 'Unknown'} disconnected (${socket.id})`);
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

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
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