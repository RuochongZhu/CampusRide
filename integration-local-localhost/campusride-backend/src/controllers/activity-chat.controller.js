import { supabaseAdmin } from '../config/database.js';
import socketManager from '../config/socket.js';

// Get activity chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is participant of this activity
    const { data: participant } = await supabaseAdmin
      .from('activity_participants')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    // Also check if user is organizer
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id, title')
      .eq('id', activityId)
      .single();

    if (!participant && activity?.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not a member of this activity' }
      });
    }

    // Get messages with sender info
    const { data: messages, error, count } = await supabaseAdmin
      .from('activity_chat_messages')
      .select(`
        id,
        activity_id,
        sender_id,
        content,
        message_type,
        attachment_url,
        created_at,
        sender:users!activity_chat_messages_sender_id_fkey (
          id, first_name, last_name, avatar_url, email
        )
      `, { count: 'exact' })
      .eq('activity_id', activityId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting chat messages:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to get chat messages' }
      });
    }

    res.json({
      success: true,
      data: {
        messages: messages || [],
        activity_title: activity?.title,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Send chat message
export const sendChatMessage = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;
    const { content, message_type = 'text', attachment_url } = req.body;

    if (!content?.trim() && !attachment_url) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message content is required' }
      });
    }

    // Verify user is participant or organizer
    const { data: participant } = await supabaseAdmin
      .from('activity_participants')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id, title')
      .eq('id', activityId)
      .single();

    if (!participant && activity?.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not a member of this activity' }
      });
    }

    // Create message
    const { data: message, error } = await supabaseAdmin
      .from('activity_chat_messages')
      .insert({
        activity_id: activityId,
        sender_id: userId,
        content: content?.trim() || '',
        message_type,
        attachment_url
      })
      .select(`
        id,
        activity_id,
        sender_id,
        content,
        message_type,
        attachment_url,
        created_at,
        sender:users!activity_chat_messages_sender_id_fkey (
          id, first_name, last_name, avatar_url, email
        )
      `)
      .single();

    if (error) {
      console.error('Error sending chat message:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to send message' }
      });
    }

    // Broadcast message via Socket.IO
    socketManager.io?.to(`activity:${activityId}`).emit('activity_chat_message', {
      ...message,
      activity_title: activity?.title
    });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Delete chat message
export const deleteChatMessage = async (req, res) => {
  try {
    const { activityId, messageId } = req.params;
    const userId = req.user.id;

    // Get the message
    const { data: message } = await supabaseAdmin
      .from('activity_chat_messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .eq('activity_id', activityId)
      .single();

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    // Get activity info
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id')
      .eq('id', activityId)
      .single();

    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Check permissions: user can delete own message, or organizer can delete any, or admin can delete any
    const isMessageOwner = message.sender_id === userId;
    const isOrganizer = activity?.organizer_id === userId;
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

    if (!isMessageOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to delete this message' }
      });
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('activity_chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting chat message:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete message' }
      });
    }

    // Log moderation action if admin or organizer
    if (isAdmin || isOrganizer) {
      await supabaseAdmin
        .from('activity_moderation_logs')
        .insert({
          activity_id: activityId,
          moderator_id: userId,
          action: 'delete_message',
          target_message_id: messageId,
          reason: 'Moderation action'
        });
    }

    // Broadcast deletion via Socket.IO
    socketManager.io?.to(`activity:${activityId}`).emit('activity_chat_message_deleted', {
      message_id: messageId,
      activity_id: activityId
    });

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Get chat members (activity participants)
export const getChatMembers = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // Verify user is participant or organizer
    const { data: participant } = await supabaseAdmin
      .from('activity_participants')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id, title')
      .eq('id', activityId)
      .single();

    if (!participant && activity?.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not a member of this activity' }
      });
    }

    // Get all participants
    const { data: participants, error } = await supabaseAdmin
      .from('activity_participants')
      .select(`
        id,
        user_id,
        attendance_status,
        registration_time,
        user:users!activity_participants_user_id_fkey (
          id, first_name, last_name, avatar_url, email,
          avg_rating, total_carpools, total_activities, total_sales, points
        )
      `)
      .eq('activity_id', activityId)
      .in('attendance_status', ['registered', 'attended']);

    if (error) {
      console.error('Error getting chat members:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to get members' }
      });
    }

    // Get organizer info
    const { data: organizer } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, avatar_url, email, avg_rating, total_carpools, total_activities, total_sales, points')
      .eq('id', activity.organizer_id)
      .single();

    const members = [
      { ...organizer, is_organizer: true },
      ...participants.map(p => ({ ...p.user, is_organizer: false, registration_time: p.registration_time }))
    ];

    // Check online status
    const onlineUserIds = socketManager.getOnlineUserIds?.() || [];
    const membersWithOnline = members.map(m => ({
      ...m,
      is_online: onlineUserIds.includes(String(m.id))
    }));

    res.json({
      success: true,
      data: {
        members: membersWithOnline,
        activity_title: activity?.title,
        total: membersWithOnline.length
      }
    });
  } catch (error) {
    console.error('Get chat members error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // Update read status (you might want to create a separate table for this)
    // For now, just return success
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};
