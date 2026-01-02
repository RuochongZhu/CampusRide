import { supabase } from '../config/database.js';

/**
 * Get all system messages with sender info
 */
export const getSystemMessages = async (userId, { limit = 100, offset = 0 } = {}) => {
  try {
    // Get messages with sender info
    const { data: messages, error } = await supabase
      .from('system_messages')
      .select(`
        id,
        sender_id,
        sender_type,
        content,
        message_type,
        is_pinned,
        created_at,
        updated_at,
        sender:users!system_messages_sender_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          role
        )
      `)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get read status for this user
    const { data: reads } = await supabase
      .from('system_message_reads')
      .select('message_id')
      .eq('user_id', userId);

    const readMessageIds = new Set((reads || []).map(r => r.message_id));

    // Format messages with read status
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_type === 'admin' ? 'system' : msg.sender_id,
      sender_type: msg.sender_type,
      sender_first_name: msg.sender_type === 'admin' ? 'System' : (msg.sender?.first_name || 'User'),
      sender_last_name: msg.sender_type === 'admin' ? 'Admin' : (msg.sender?.last_name || ''),
      sender_avatar_url: msg.sender?.avatar_url || null,
      content: msg.content,
      message_type: msg.message_type,
      is_pinned: msg.is_pinned,
      is_read: readMessageIds.has(msg.id),
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    return {
      success: true,
      data: {
        messages: formattedMessages,
        total: formattedMessages.length
      }
    };
  } catch (error) {
    console.error('Error fetching system messages:', error);
    throw error;
  }
};

/**
 * Send a system message (admin sends as announcement, user sends as feedback)
 */
export const sendSystemMessage = async (userId, userRole, { content, message_type = 'general' }) => {
  try {
    const isAdmin = userRole === 'admin';

    const { data: message, error } = await supabase
      .from('system_messages')
      .insert({
        sender_id: userId,
        sender_type: isAdmin ? 'admin' : 'user',
        content: content.trim(),
        message_type: isAdmin ? (message_type || 'announcement') : 'feedback'
      })
      .select(`
        id,
        sender_id,
        sender_type,
        content,
        message_type,
        is_pinned,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    // Get sender info
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      success: true,
      data: {
        id: message.id,
        sender_id: message.sender_type === 'admin' ? 'system' : message.sender_id,
        sender_type: message.sender_type,
        sender_first_name: message.sender_type === 'admin' ? 'System' : (sender?.first_name || 'User'),
        sender_last_name: message.sender_type === 'admin' ? 'Admin' : (sender?.last_name || ''),
        sender_avatar_url: sender?.avatar_url || null,
        content: message.content,
        message_type: message.message_type,
        is_pinned: message.is_pinned,
        is_read: true,
        created_at: message.created_at,
        updated_at: message.updated_at
      }
    };
  } catch (error) {
    console.error('Error sending system message:', error);
    throw error;
  }
};

/**
 * Mark system messages as read for a user
 */
export const markSystemMessagesAsRead = async (userId, messageIds = null) => {
  try {
    // If no specific IDs, mark all unread messages as read
    if (!messageIds || messageIds.length === 0) {
      const { data: messages } = await supabase
        .from('system_messages')
        .select('id');

      messageIds = (messages || []).map(m => m.id);
    }

    if (messageIds.length === 0) {
      return { success: true, data: { marked: 0 } };
    }

    // Insert read records (ignore duplicates)
    const readRecords = messageIds.map(messageId => ({
      user_id: userId,
      message_id: messageId
    }));

    const { error } = await supabase
      .from('system_message_reads')
      .upsert(readRecords, {
        onConflict: 'user_id,message_id',
        ignoreDuplicates: true
      });

    if (error) throw error;

    return {
      success: true,
      data: { marked: messageIds.length }
    };
  } catch (error) {
    console.error('Error marking system messages as read:', error);
    throw error;
  }
};

/**
 * Get unread count for system messages
 */
export const getSystemMessagesUnreadCount = async (userId) => {
  try {
    // Count total messages
    const { count: totalCount, error: totalError } = await supabase
      .from('system_messages')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Count read messages for this user
    const { count: readCount, error: readError } = await supabase
      .from('system_message_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (readError) throw readError;

    return {
      success: true,
      data: {
        unread_count: Math.max(0, (totalCount || 0) - (readCount || 0))
      }
    };
  } catch (error) {
    console.error('Error getting system messages unread count:', error);
    throw error;
  }
};

/**
 * Delete a system message (admin only)
 */
export const deleteSystemMessage = async (messageId, userId, userRole) => {
  try {
    // Check if user is admin or message sender
    const { data: message, error: fetchError } = await supabase
      .from('system_messages')
      .select('sender_id, sender_type')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Only admin can delete admin messages, users can delete their own feedback
    const canDelete = userRole === 'admin' ||
      (message.sender_type === 'user' && message.sender_id === userId);

    if (!canDelete) {
      return { success: false, error: 'Not authorized to delete this message' };
    }

    const { error: deleteError } = await supabase
      .from('system_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting system message:', error);
    throw error;
  }
};

export default {
  getSystemMessages,
  sendSystemMessage,
  markSystemMessagesAsRead,
  getSystemMessagesUnreadCount,
  deleteSystemMessage
};
