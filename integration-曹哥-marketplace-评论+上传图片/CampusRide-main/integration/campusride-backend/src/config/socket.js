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

    // Handle marketplace conversation joining
    socket.on('join_marketplace_conversation', (conversationId) => {
      socket.join(`marketplace_conversation:${conversationId}`);
      console.log(`🛒 User ${userId} joined marketplace conversation ${conversationId}`);
    });

    // Handle marketplace conversation leaving
    socket.on('leave_marketplace_conversation', (conversationId) => {
      socket.leave(`marketplace_conversation:${conversationId}`);
      console.log(`👋 User ${userId} left marketplace conversation ${conversationId}`);
    });

    // Handle typing indicators for marketplace conversations
    socket.on('marketplace_typing', ({ conversationId, isTyping }) => {
      socket.to(`marketplace_conversation:${conversationId}`).emit('marketplace_typing_indicator', {
        userId,
        conversationId,
        isTyping,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    });

    // Handle marketplace message read status
    socket.on('marketplace_message_read', ({ conversationId, messageId }) => {
      socket.to(`marketplace_conversation:${conversationId}`).emit('marketplace_message_read', {
        conversationId,
        messageId,
        readByUserId: userId
      });
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

  // Send message to thread participants
  sendMessageToThread(threadId, message) {
    this.io.to(`thread:${threadId}`).emit('new_message', message);
    console.log(`💬 Message sent to thread ${threadId}`);
  }

  // Send typing indicator to thread
  sendTypingToThread(threadId, userId, isTyping) {
    this.io.to(`thread:${threadId}`).emit('typing_indicator', { userId, isTyping });
  }

  // Send marketplace message to conversation participants
  sendMarketplaceMessage(conversationId, message) {
    this.io.to(`marketplace_conversation:${conversationId}`).emit('new_marketplace_message', message);
    console.log(`🛒 Marketplace message sent to conversation ${conversationId}`);
  }

  // Send marketplace typing indicator
  sendMarketplaceTyping(conversationId, userId, isTyping) {
    this.io.to(`marketplace_conversation:${conversationId}`).emit('marketplace_typing_indicator', {
      userId,
      conversationId,
      isTyping
    });
  }

  // Send marketplace conversation update (new conversation, status change, etc.)
  sendMarketplaceConversationUpdate(conversationId, update) {
    this.io.to(`marketplace_conversation:${conversationId}`).emit('marketplace_conversation_update', update);
  }

  // Notify user about new marketplace conversation
  notifyNewMarketplaceConversation(userId, conversation) {
    this.sendNotificationToUser(userId, {
      type: 'marketplace_conversation',
      data: conversation,
      message: 'You have a new message about your marketplace item'
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get IO instance
  getIO() {
    return this.io;
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