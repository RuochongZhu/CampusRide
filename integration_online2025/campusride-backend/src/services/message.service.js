import { supabaseAdmin } from '../config/database.js';
import socketManager from '../config/socket.js';

class MessageService {
  // Send a new message
  async sendMessage(messageData) {
    try {
      const {
        activityId,
        senderId,
        receiverId,
        receiverEmail,
        subject,
        content,
        messageType = 'activity_inquiry',
        priority = 'normal'
      } = messageData;

      // Check if activity exists
      const { data: activities, error: activityError } = await supabaseAdmin
        .from('activities')
        .select('id, organizer_id, title')
        .eq('id', activityId);

      console.log('Activity query result:', { activityId, activities, activityError });

      if (activityError || !activities || activities.length === 0) {
        console.error('Activity not found - Query details:', { activityId, activities, activityError });
        throw new Error('Activity not found');
      }

      const activity = activities[0];

      // If receiver_email is provided, look up the receiver_id
      let finalReceiverId = receiverId;
      if (receiverEmail && !receiverId) {
        const { data: receiver, error: receiverError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', receiverEmail)
          .single();

        if (receiverError || !receiver) {
          throw new Error(`User with email ${receiverEmail} not found`);
        }

        finalReceiverId = receiver.id;
      }

      if (!finalReceiverId) {
        throw new Error('Receiver ID or email is required');
      }

      // Generate thread ID
      const threadId = crypto.randomUUID();

      // Create the message
      const { data: messageResult, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          activity_id: activityId,
          sender_id: senderId,
          receiver_id: finalReceiverId,
          subject: subject,
          content: content,
          message_type: messageType,
          thread_id: threadId,
          priority: priority
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Add participants to the thread
      const { error: participantsError } = await supabaseAdmin
        .from('message_participants')
        .insert([
          { thread_id: threadId, user_id: senderId },
          { thread_id: threadId, user_id: finalReceiverId }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
      }

      // Create notification for receiver
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: finalReceiverId,
          type: 'new_message',
          title: `New message: ${subject}`,
          content: 'You received a new message about an activity',
          data: {
            message_id: messageResult.id,
            thread_id: threadId,
            activity_id: activityId,
            sender_id: senderId
          },
          priority: 'medium'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Send real-time notification via Socket.IO
      if (socketManager) {
        socketManager.sendMessageToThread(threadId, messageResult);
      }

      return {
        message_id: messageResult.id,
        thread_id: threadId,
        status: 'sent'
      };

    } catch (error) {
      console.error('❌ Error in sendMessage service:', error);
      throw error;
    }
  }

  // Get messages for a user
  async getMessages(userId, filters) {
    try {
      const { page = 1, limit = 20, type = 'all', unreadOnly = false } = filters;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Filter by message type (sent/received/all)
      if (type === 'sent') {
        query = query.eq('sender_id', userId);
      } else if (type === 'received') {
        query = query.eq('receiver_id', userId);
      } else {
        // All messages (sent or received)
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      // Filter unread only
      if (unreadOnly && type !== 'sent') {
        query = query.eq('receiver_id', userId).eq('is_read', false);
      }

      const { data: messages, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        messages: messages || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessages service:', error);
      throw error;
    }
  }

  // Get message threads for a user
  async getMessageThreads(userId, filters) {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      // Get distinct threads for the user
      const { data: threads, error, count } = await supabaseAdmin
        .from('message_participants')
        .select(`
          thread_id,
          messages(
            id,
            thread_id,
            subject,
            content,
            sender_id,
            receiver_id,
            activity_id,
            is_read,
            created_at,
            sender:sender_id(first_name, last_name),
            receiver:receiver_id(first_name, last_name),
            activity:activity_id(title)
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active')
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Process threads to get summary info
      const processedThreads = (threads || []).map(tp => {
        const messages = tp.messages || [];
        const lastMessage = messages[messages.length - 1];
        const unreadCount = messages.filter(m => m.receiver_id === userId && !m.is_read).length;

        return {
          thread_id: tp.thread_id,
          subject: messages[0]?.subject || 'No subject',
          last_message_preview: lastMessage?.content?.substring(0, 100) || '',
          unread_count: unreadCount,
          participant_count: 2,
          last_message_time: lastMessage?.created_at,
          activity_title: lastMessage?.activity?.title
        };
      });

      return {
        data: processedThreads,
        pagination: {
          current_page: page,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessageThreads service:', error);
      throw error;
    }
  }

  // Get messages in a specific thread
  async getThreadMessages(userId, threadId, filters) {
    try {
      // Check if user is participant in this thread
      const { data: participant, error: participantError } = await supabaseAdmin
        .from('message_participants')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (participantError || !participant) {
        throw new Error('Access denied: User is not a participant in this thread');
      }

      const { page = 1, limit = 50 } = filters;
      const offset = (page - 1) * limit;

      const { data: messages, error, count } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        messages: messages || [],
        threadId: threadId,
        pagination: {
          current_page: page,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getThreadMessages service:', error);
      throw error;
    }
  }

  // Reply to a message thread
  async replyToThread(userId, threadId, content, replyToId = null) {
    try {
      // Check if user is participant in this thread
      const { data: participant, error: participantError } = await supabaseAdmin
        .from('message_participants')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (participantError || !participant) {
        throw new Error('Access denied: User is not a participant in this thread');
      }

      // Get the first message in the thread to get activity_id and receiver_id
      const { data: firstMessage, error: firstMessageError } = await supabaseAdmin
        .from('messages')
        .select('activity_id, sender_id, receiver_id')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstMessageError || !firstMessage) {
        throw new Error('Thread not found');
      }

      // Determine receiver (the other participant)
      const receiverId = firstMessage.sender_id === userId ? firstMessage.receiver_id : firstMessage.sender_id;

      // Create reply message
      const { data: newMessage, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          activity_id: firstMessage.activity_id,
          sender_id: userId,
          receiver_id: receiverId,
          subject: 'Re: ' + (await this._getThreadSubject(threadId)),
          content: content,
          message_type: 'general',
          thread_id: threadId,
          reply_to: replyToId
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Update last_read_at for the participant
      await supabaseAdmin
        .from('message_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', userId);

      // Send real-time notification via Socket.IO
      if (socketManager) {
        socketManager.sendMessageToThread(threadId, newMessage);
      }

      return newMessage;

    } catch (error) {
      console.error('❌ Error in replyToThread service:', error);
      throw error;
    }
  }

  // Mark thread as read
  async markThreadAsRead(userId, threadId) {
    try {
      // Update all messages in thread as read for this user
      const { error: updateError } = await supabaseAdmin
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('receiver_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update last_read_at for the participant
      const { error: participantError } = await supabaseAdmin
        .from('message_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', userId);

      if (participantError) {
        console.error('Error updating participant last_read_at:', participantError);
      }

      return {
        threadId: threadId,
        marked_as_read: true
      };

    } catch (error) {
      console.error('❌ Error in markThreadAsRead service:', error);
      throw error;
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      return {
        unread_count: count || 0
      };

    } catch (error) {
      console.error('❌ Error in getUnreadCount service:', error);
      throw error;
    }
  }

  // Delete a message (soft delete)
  async deleteMessage(userId, messageId) {
    try {
      // Check if user is the sender of this message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', userId)
        .eq('status', 'active')
        .single();

      if (messageError || !message) {
        throw new Error('Message not found or access denied');
      }

      // Soft delete the message
      const { error: deleteError } = await supabaseAdmin
        .from('messages')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      return {
        messageId: messageId,
        deleted: true
      };

    } catch (error) {
      console.error('❌ Error in deleteMessage service:', error);
      throw error;
    }
  }

  // Archive a message
  async archiveMessage(userId, messageId) {
    try {
      // Check if user is sender or receiver of this message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('status', 'active')
        .single();

      if (messageError || !message) {
        throw new Error('Message not found');
      }

      if (message.sender_id !== userId && message.receiver_id !== userId) {
        throw new Error('Access denied');
      }

      // Archive the message
      const { error: archiveError } = await supabaseAdmin
        .from('messages')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (archiveError) {
        throw archiveError;
      }

      return {
        messageId: messageId,
        archived: true
      };

    } catch (error) {
      console.error('❌ Error in archiveMessage service:', error);
      throw error;
    }
  }

  // Block a user
  async blockUser(userId, blockedUserId) {
    try {
      const { error } = await supabaseAdmin
        .from('blocked_users')
        .insert({
          user_id: userId,
          blocked_user_id: blockedUserId
        });

      if (error) {
        throw error;
      }

      return { blocked: true };

    } catch (error) {
      console.error('❌ Error in blockUser service:', error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(userId, blockedUserId) {
    try {
      const { error } = await supabaseAdmin
        .from('blocked_users')
        .delete()
        .eq('user_id', userId)
        .eq('blocked_user_id', blockedUserId);

      if (error) {
        throw error;
      }

      return { unblocked: true };

    } catch (error) {
      console.error('❌ Error in unblockUser service:', error);
      throw error;
    }
  }

  // Check if user is blocked
  async isUserBlocked(userId, otherUserId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)
        .eq('blocked_user_id', otherUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { blocked: !!data };

    } catch (error) {
      console.error('❌ Error in isUserBlocked service:', error);
      throw error;
    }
  }

  // Helper method to get thread subject
  async _getThreadSubject(threadId) {
    try {
      const { data: message } = await supabaseAdmin
        .from('messages')
        .select('subject')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      return message?.subject || 'No subject';
    } catch (error) {
      return 'No subject';
    }
  }
}

export default new MessageService();
