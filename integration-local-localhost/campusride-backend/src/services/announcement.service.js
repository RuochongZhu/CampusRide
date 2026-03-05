// System Announcements Service
import { supabaseAdmin } from '../config/database.js';
import { socketManager } from '../app.js';
import notificationService from './notification.service.js';

class AnnouncementService {
  // Create system announcement
  async createAnnouncement(announcementData) {
    try {
      const {
        admin_id,
        title,
        content,
        announcement_type = 'general',
        priority = 0,
        is_pinned = false,
        target_scope = 'all',
        target_activity_ids = null,
        show_in_notification = true,
        show_in_activity_chat = true,
        show_in_dashboard = true,
        scheduled_until = null
      } = announcementData;

      // Validate inputs
      if (!admin_id || !title || !content) {
        throw new Error('Missing required fields: admin_id, title, content');
      }

      if (!['general', 'warning', 'important', 'maintenance'].includes(announcement_type)) {
        throw new Error('Invalid announcement type');
      }

      if (!['all', 'activity_only', 'specific_users'].includes(target_scope)) {
        throw new Error('Invalid target scope');
      }

      // Create announcement
      const { data, error } = await supabaseAdmin
        .from('system_announcements')
        .insert({
          admin_id,
          title,
          content,
          announcement_type,
          priority,
          is_pinned,
          target_scope,
          target_activity_ids,
          show_in_notification,
          show_in_activity_chat,
          show_in_dashboard,
          scheduled_until,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`📢 System announcement created: ${data.id}`);

      // Broadcast to all connected clients via socket
      if (show_in_dashboard || show_in_notification) {
        socketManager.broadcastNotification({
          type: 'system_announcement',
          announcement_id: data.id,
          title: data.title,
          content: data.content,
          announcement_type: data.announcement_type,
          priority: data.priority,
          is_pinned: data.is_pinned
        });
      }

      // Send notifications if enabled
      if (show_in_notification) {
        await this.sendAnnouncementNotifications(data, target_scope, target_activity_ids);
      }

      return {
        success: true,
        announcement: data
      };

    } catch (error) {
      console.error('❌ Create announcement error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send announcement to activity chat
  async sendAnnouncementToActivity(announcementId, activityId) {
    try {
      const { data: announcement, error: fetchError } = await supabaseAdmin
        .from('system_announcements')
        .select('*')
        .eq('id', announcementId)
        .single();

      if (fetchError || !announcement) {
        throw new Error('Announcement not found');
      }

      if (!announcement.show_in_activity_chat) {
        return { success: true, message: 'Announcement not configured for activity chat' };
      }

      // Create a system message in the activity chat
      const { data: message, error: insertError } = await supabaseAdmin
        .from('activity_chat_messages')
        .insert({
          activity_id: activityId,
          sender_id: announcement.admin_id,
          content: announcement.content,
          message_type: 'system_announcement',
          attachment_url: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log(`📢 Announcement sent to activity ${activityId}`);

      // Broadcast via socket
      socketManager.sendNotificationToActivity(activityId, {
        type: 'announcement_message',
        message_id: message.id,
        title: announcement.title,
        content: announcement.content,
        announcement_type: announcement.announcement_type
      });

      return {
        success: true,
        message_id: message.id
      };

    } catch (error) {
      console.error('❌ Send announcement to activity error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send notifications for announcement
  async sendAnnouncementNotifications(announcement, targetScope, targetActivityIds) {
    try {
      let userIds = [];

      if (targetScope === 'all') {
        // Get all active users
        const { data: users, error } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('is_active', true);

        if (!error && users) {
          userIds = users.map(u => u.id);
        }
      } else if (targetScope === 'activity_only' && targetActivityIds?.length > 0) {
        // Get participants from specific activities
        const { data: participants, error } = await supabaseAdmin
          .from('activity_participants')
          .select('user_id')
          .in('activity_id', targetActivityIds);

        if (!error && participants) {
          userIds = [...new Set(participants.map(p => p.user_id))];
        }
      }

      // Send notifications
      for (const userId of userIds) {
        await notificationService.sendNotification({
          userId,
          type: 'system_announcement',
          title: announcement.title,
          content: announcement.content,
          data: {
            announcement_id: announcement.id,
            announcement_type: announcement.announcement_type
          },
          channels: ['socket', 'database']
        });
      }

      console.log(`📤 Sent announcement notification to ${userIds.length} users`);
      return { success: true, recipients: userIds.length };

    } catch (error) {
      console.error('❌ Send announcement notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active announcements
  async getActiveAnnouncements(limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from('active_system_announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        announcements: data || [],
        count: data?.length || 0
      };

    } catch (error) {
      console.error('❌ Get announcements error:', error);
      return {
        success: false,
        error: error.message,
        announcements: []
      };
    }
  }

  // Pin/unpin announcement
  async updateAnnouncementPin(announcementId, isPinned) {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_announcements')
        .update({ is_pinned: isPinned })
        .eq('id', announcementId)
        .select()
        .single();

      if (error) throw error;

      console.log(`📌 Announcement ${isPinned ? 'pinned' : 'unpinned'}: ${announcementId}`);
      return { success: true, announcement: data };

    } catch (error) {
      console.error('❌ Update pin error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete announcement
  async deleteAnnouncement(announcementId) {
    try {
      const { error } = await supabaseAdmin
        .from('system_announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      console.log(`🗑️ Announcement deleted: ${announcementId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Delete announcement error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AnnouncementService();
