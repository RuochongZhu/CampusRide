import { supabaseAdmin } from '../config/database.js';
import socketManager from '../config/socket.js';

class MessageService {
  // Send a new message (now with reply restriction logic)
  async sendMessage(messageData) {
    try {
      const {
        senderId,
        receiverId,
        subject,
        content,
        messageType = 'general',
        contextType = 'general',
        contextId = null,
        priority = 'normal'
      } = messageData;

      // Check if there's an existing thread between these users
      const existingThread = await this.findExistingThread(senderId, receiverId);

      if (existingThread) {
        // Check if sender can send more messages (reply restriction)
        const canSend = await this.checkCanSendMessage(existingThread.thread_id, senderId);

        if (!canSend) {
          throw new Error('REPLY_REQUIRED: You must wait for the recipient to reply before sending more messages');
        }

        // Reply to existing thread
        return await this.replyToThread(senderId, existingThread.thread_id, content);
      } else {
        // Create new thread
        return await this.createNewThread({
          senderId,
          receiverId,
          subject,
          content,
          messageType,
          contextType,
          contextId,
          priority
        });
      }

    } catch (error) {
      console.error('❌ Error in sendMessage service:', error);
      throw error;
    }
  }

  // Find existing thread between two users
  async findExistingThread(senderId, receiverId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('message_participants')
        .select(`
          thread_id,
          messages!inner(*)
        `)
        .or(`and(user_id.eq.${senderId}),and(user_id.eq.${receiverId})`)
        .eq('status', 'active')
        .limit(1);

      if (error) throw error;

      // Find a thread where both users are participants
      if (data && data.length > 0) {
        const threadId = data[0].thread_id;

        // Verify both users are in this thread
        const { data: participants, error: participantsError } = await supabaseAdmin
          .from('message_participants')
          .select('user_id')
          .eq('thread_id', threadId)
          .in('user_id', [senderId, receiverId])
          .eq('status', 'active');

        if (participantsError) throw participantsError;

        if (participants && participants.length === 2) {
          return { thread_id: threadId };
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error finding existing thread:', error);
      return null;
    }
  }

  // Check if user can send message (reply restriction logic)
  async checkCanSendMessage(threadId, senderId) {
    try {
      // Get all messages in thread ordered by creation time
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('sender_id, created_at')
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        // No messages in thread, can send first message
        return true;
      }

      if (messages.length === 1) {
        // Only one message exists
        const firstMessage = messages[0];
        if (firstMessage.sender_id === senderId) {
          // Sender sent the first message, must wait for reply
          return false;
        } else {
          // Receiver sent first message, sender can reply
          return true;
        }
      }

      // Multiple messages exist - check if there's been a reply cycle
      let lastSenderId = null;
      let consecutiveBySameSender = 0;

      for (const message of messages.reverse()) { // Most recent first
        if (message.sender_id === lastSenderId) {
          consecutiveBySameSender++;
        } else {
          consecutiveBySameSender = 1;
        }
        lastSenderId = message.sender_id;
      }

      // If the last message was from the current sender and they sent more than 1 consecutive message
      if (lastSenderId === senderId && consecutiveBySameSender >= 1) {
        return false; // Must wait for other person to reply
      }

      return true;

    } catch (error) {
      console.error('❌ Error checking send permission:', error);
      // Default to allowing send to avoid blocking in case of error
      return true;
    }
  }

  // Get reply status for a thread (for UI display)
  async getReplyStatus(threadId, userId) {
    try {
      const canSend = await this.checkCanSendMessage(threadId, userId);

      // Get last message info
      const { data: lastMessage, error } = await supabaseAdmin
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        can_send: canSend,
        awaiting_reply: !canSend,
        last_message_from_user: lastMessage?.sender_id === userId,
        last_message_at: lastMessage?.created_at
      };

    } catch (error) {
      console.error('❌ Error getting reply status:', error);
      return {
        can_send: true,
        awaiting_reply: false,
        last_message_from_user: false,
        last_message_at: null
      };
    }
  }

  // Create new message thread
  async createNewThread(threadData) {
    try {
      // Generate thread ID
      const threadId = crypto.randomUUID();

      // Insert initial message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: threadData.senderId,
          receiver_id: threadData.receiverId,
          subject: threadData.subject,
          content: threadData.content,
          message_type: threadData.messageType,
          context_type: threadData.contextType,
          context_id: threadData.contextId,
          priority: threadData.priority,
          is_read: false,
          status: 'active'
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      // Insert participants
      const participantsData = [
        {
          thread_id: threadId,
          user_id: threadData.senderId,
          joined_at: new Date().toISOString(),
          status: 'active'
        },
        {
          thread_id: threadId,
          user_id: threadData.receiverId,
          joined_at: new Date().toISOString(),
          status: 'active'
        }
      ];

      const { error: participantsError } = await supabaseAdmin
        .from('message_participants')
        .insert(participantsData);

      if (participantsError) throw participantsError;

      // Get message with user details
      const enrichedMessage = await this.getMessageWithUserDetails(message.id);

      // Send real-time notification
      if (socketManager) {
        socketManager.sendMessageToThread(threadId, enrichedMessage);
      }

      return {
        message: enrichedMessage,
        threadId: threadId
      };

    } catch (error) {
      console.error('❌ Error creating new thread:', error);
      throw error;
    }
  }

  // Get messages for a user
  async getMessages(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'all', // 'sent', 'received', 'all'
        unreadOnly = false
      } = filters;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, first_name, last_name, nickname, email),
          receiver:users!receiver_id(id, first_name, last_name, nickname, email)
        `)
        .eq('status', 'active');

      // Filter by message type
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

      if (error) throw error;

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
  async getMessageThreads(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        with_user_id = null
      } = filters;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('message_participants')
        .select(`
          thread_id,
          messages!thread_id(
            id, subject, content, sender_id, receiver_id, created_at, is_read,
            sender:users!sender_id(id, first_name, last_name, nickname, email),
            receiver:users!receiver_id(id, first_name, last_name, nickname, email)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Filter by specific user if requested
      if (with_user_id) {
        // Find threads that include both users
        const { data: mutualThreads, error: mutualError } = await supabaseAdmin
          .from('message_participants')
          .select('thread_id')
          .eq('user_id', with_user_id)
          .eq('status', 'active');

        if (mutualError) throw mutualError;

        const mutualThreadIds = mutualThreads.map(t => t.thread_id);

        if (mutualThreadIds.length > 0) {
          query = query.in('thread_id', mutualThreadIds);
        } else {
          // No mutual threads found
          return {
            threads: [],
            pagination: { current_page: page, per_page: limit, total: 0, total_pages: 0 }
          };
        }
      }

      const { data: threadData, error } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Process threads to get thread summary
      const threads = this.processThreadSummaries(threadData, userId);

      return {
        threads: threads || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: threads?.length || 0,
          total_pages: Math.ceil((threads?.length || 0) / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessageThreads service:', error);
      throw error;
    }
  }

  // Process thread summaries
  processThreadSummaries(threadData, currentUserId) {
    const threadMap = new Map();

    threadData.forEach(participant => {
      const threadId = participant.thread_id;

      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, {
          thread_id: threadId,
          messages: [],
          unread_count: 0,
          participants: []
        });
      }

      const thread = threadMap.get(threadId);
      if (participant.messages) {
        participant.messages.forEach(msg => {
          thread.messages.push(msg);
          if (msg.receiver_id === currentUserId && !msg.is_read) {
            thread.unread_count++;
          }
        });
      }
    });

    // Convert to array and add summary fields
    return Array.from(threadMap.values()).map(thread => {
      thread.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const lastMessage = thread.messages[0];
      const firstMessage = thread.messages[thread.messages.length - 1];

      // Find the other participant
      const otherParticipant = lastMessage?.sender_id === currentUserId
        ? lastMessage?.receiver
        : lastMessage?.sender;

      return {
        thread_id: thread.thread_id,
        subject: firstMessage?.subject || 'No subject',
        last_message: lastMessage?.content || '',
        last_message_time: lastMessage?.created_at,
        last_sender_id: lastMessage?.sender_id,
        message_count: thread.messages.length,
        unread_count: thread.unread_count,
        other_user: otherParticipant,
        updated_at: lastMessage?.created_at
      };
    }).sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
  }

  // Get messages in a specific thread
  async getThreadMessages(userId, threadId, filters = {}) {
    try {
      // Verify user is participant
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
        .select(`
          *,
          sender:users!sender_id(id, first_name, last_name, nickname, email),
          receiver:users!receiver_id(id, first_name, last_name, nickname, email)
        `, { count: 'exact' })
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

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
      // Verify user is participant
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

      // Check if user can send message (reply restriction)
      const canSend = await this.checkCanSendMessage(threadId, userId);
      if (!canSend) {
        throw new Error('REPLY_REQUIRED: You must wait for the recipient to reply before sending more messages');
      }

      // Get thread info for receiver_id
      const { data: threadInfo, error: threadError } = await supabaseAdmin
        .from('message_participants')
        .select('user_id')
        .eq('thread_id', threadId)
        .neq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (threadError) throw threadError;

      // Insert new message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: userId,
          receiver_id: threadInfo.user_id,
          content: content,
          reply_to: replyToId,
          message_type: 'general',
          is_read: false,
          status: 'active'
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      // Get message with user details
      const enrichedMessage = await this.getMessageWithUserDetails(message.id);

      // Send real-time notification
      if (socketManager) {
        socketManager.sendMessageToThread(threadId, enrichedMessage);
      }

      return enrichedMessage;

    } catch (error) {
      console.error('❌ Error in replyToThread service:', error);
      throw error;
    }
  }

  // Mark thread as read
  async markThreadAsRead(userId, threadId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .eq('status', 'active')
        .select('id');

      if (error) throw error;

      return {
        updatedCount: data?.length || 0,
        threadId: threadId
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

      if (error) throw error;

      return count || 0;

    } catch (error) {
      console.error('❌ Error in getUnreadCount service:', error);
      throw error;
    }
  }

  // Delete a message (soft delete)
  async deleteMessage(userId, messageId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId)
        .eq('status', 'active')
        .select('id');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Message not found or access denied');
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
      const { data, error } = await supabaseAdmin
        .from('messages')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'active')
        .select('id');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Message not found or access denied');
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

  // Helper: Get message with user details
  async getMessageWithUserDetails(messageId) {
    try {
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, first_name, last_name, nickname, email),
          receiver:users!receiver_id(id, first_name, last_name, nickname, email)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;

      return message;

    } catch (error) {
      console.error('❌ Error getting message with user details:', error);
      throw error;
    }
  }
}

export default new MessageService();