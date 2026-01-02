import { supabase } from '../config/database.js';
import { socketManager } from '../app.js';

class NotificationService {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Define notification templates
    this.templates.set('activity_new', {
      title: '新活动发布',
      template: '{{organizerName}}发布了新活动"{{activityTitle}}"，快来参加吧！',
      icon: 'calendar',
      priority: 'medium'
    });

    this.templates.set('activity_reminder', {
      title: '活动提醒',
      template: '您报名的活动"{{activityTitle}}"将在{{timeUntil}}开始',
      icon: 'clock',
      priority: 'high'
    });

    this.templates.set('activity_cancelled', {
      title: '活动取消',
      template: '很抱歉，活动"{{activityTitle}}"已被取消',
      icon: 'x-circle',
      priority: 'high'
    });

    this.templates.set('points_earned', {
      title: '积分获得',
      template: '恭喜！您获得了{{points}}积分，原因：{{reason}}',
      icon: 'star',
      priority: 'low'
    });

    this.templates.set('rank_changed', {
      title: '排名变化',
      template: '您的排名发生变化：{{oldRank}} → {{newRank}}',
      icon: 'trending-up',
      priority: 'medium'
    });

    this.templates.set('system_announcement', {
      title: '系统公告',
      template: '{{content}}',
      icon: 'megaphone',
      priority: 'high'
    });
  }

  async sendNotification(options) {
    try {
      const {
        userId,
        type,
        title,
        content,
        data = {},
        channels = ['socket', 'database'],
        priority = 'medium'
      } = options;

      // Validate inputs
      if (!userId) {
        throw new Error('userId is required');
      }

      let notificationContent = content;
      let notificationTitle = title;

      // Use template if type is provided
      if (type && this.templates.has(type)) {
        const template = this.templates.get(type);
        notificationTitle = title || template.title;
        notificationContent = this.renderTemplate(template.template, data);
      }

      const notification = {
        user_id: userId,
        type: type || 'custom',
        title: notificationTitle,
        content: notificationContent,
        data,
        priority,
        channels,
        is_read: false
      };

      // Send through different channels
      const results = {};

      if (channels.includes('socket')) {
        results.socket = await this.sendSocketNotification(userId, notification);
      }

      if (channels.includes('database')) {
        results.database = await this.saveNotificationToDatabase(notification);
      }

      if (channels.includes('email')) {
        results.email = await this.sendEmailNotification(userId, notification);
      }

      console.log(`📤 Notification sent to user ${userId}:`, notification.title);
      return {
        success: true,
        notificationId: results.database?.data?.id,
        results
      };

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendSocketNotification(userId, notification) {
    try {
      const sent = socketManager.sendNotificationToUser(userId, notification);
      return { success: sent, channel: 'socket' };
    } catch (error) {
      console.error('Socket notification failed:', error);
      return { success: false, channel: 'socket', error: error.message };
    }
  }

  async saveNotificationToDatabase(notification) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select();

      if (error) {
        throw error;
      }

      return { success: true, channel: 'database', data: data[0] };
    } catch (error) {
      console.error('Database notification save failed:', error);
      return { success: false, channel: 'database', error: error.message };
    }
  }

  async sendEmailNotification(userId, notification) {
    try {
      // Email service would be implemented here
      // For now, just log and return mock success
      console.log(`📧 Email notification would be sent to user ${userId}:`, notification.title);
      return { success: true, channel: 'email', mock: true };
    } catch (error) {
      console.error('Email notification failed:', error);
      return { success: false, channel: 'email', error: error.message };
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        type = null,
        isRead = null
      } = options;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (isRead !== null) {
        query = query.eq('is_read', isRead);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (unreadError) {
        console.error('Failed to get unread count:', unreadError);
      }

      return {
        success: true,
        notifications: data || [],
        total: count,
        unreadCount: unreadCount || 0,
        hasMore: (data?.length || 0) === limit
      };

    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      // Check if notification exists and belongs to user
      const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (checkError || !existing) {
        throw new Error('Notification not found');
      }

      if (existing.is_read) {
        return {
          success: true,
          message: 'Notification already marked as read'
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select();

      if (error) {
        throw error;
      }

      // Send socket update
      socketManager.sendNotificationToUser(userId, {
        type: 'notification_read',
        notificationId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        notification: data[0]
      };

    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select('id');

      if (error) {
        throw error;
      }

      // Send socket update
      socketManager.sendNotificationToUser(userId, {
        type: 'all_notifications_read',
        count: data?.length || 0,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        markedCount: data?.length || 0
      };

    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      // Check if notification exists and belongs to user
      const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (checkError || !existing) {
        throw new Error('Notification not found');
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return {
        success: true,
        count: count || 0
      };

    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Batch notification methods
  async sendBatchNotification(userIds, options) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        const result = await this.sendNotification({
          ...options,
          userId
        });
        results.push({ userId, ...result });
      }

      const successCount = results.filter(r => r.success).length;
      
      return {
        success: true,
        totalSent: userIds.length,
        successCount,
        failureCount: userIds.length - successCount,
        results
      };

    } catch (error) {
      console.error('❌ Failed to send batch notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async broadcastNotification(options) {
    try {
      // Get all active users (this would need to be implemented based on your user model)
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const userIds = users.map(user => user.id);
      return await this.sendBatchNotification(userIds, options);

    } catch (error) {
      console.error('❌ Failed to broadcast notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Template rendering helper
  renderTemplate(template, data) {
    let rendered = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    }

    return rendered;
  }

  // Add new template
  addTemplate(type, template) {
    this.templates.set(type, template);
  }

  // Get available templates
  getTemplates() {
    return Array.from(this.templates.keys());
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;