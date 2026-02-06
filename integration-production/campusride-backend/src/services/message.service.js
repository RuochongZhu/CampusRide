import { supabaseAdmin } from '../config/database.js';
import socketManager from '../config/socket.js';
import crypto from 'crypto';

class MessageService {
  isMissingCanSendMessageFunction(error) {
    if (!error) return false;

    if (error.code === 'PGRST202') return true;

    const errorText = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
    return errorText.includes('can_user_send_message');
  }

  // Send a new message (now with reply restriction logic)
  async sendMessage(messageData) {
    try {
      const {
        senderId,
        receiverId,
        receiverEmail,
        subject,
        content,
        messageType = 'general',
        contextType = 'general',
        contextId = null,
        priority = 'normal'
      } = messageData;

      // If receiverEmail is provided but not receiverId, look up the user
      let actualReceiverId = receiverId;
      if (!actualReceiverId && receiverEmail) {
        console.log('🔍 Looking up user by email:', receiverEmail);
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', receiverEmail)
          .single();

        if (userError || !user) {
          console.error('❌ User not found by email:', receiverEmail, userError);
          throw new Error(`User not found with email: ${receiverEmail}`);
        }

        actualReceiverId = user.id;
        console.log('✅ Found user by email:', receiverEmail, '-> ID:', actualReceiverId);
      }

      if (!actualReceiverId) {
        throw new Error('Either receiverId or receiverEmail must be provided');
      }

      // Check if there's an existing thread between these users
      const existingThread = await this.findExistingThread(senderId, actualReceiverId);

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
          receiverId: actualReceiverId,
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
      // First, get all threads where sender is a participant
      const { data: senderThreads, error: senderError } = await supabaseAdmin
        .from('message_participants')
        .select('thread_id')
        .eq('user_id', senderId)
        .eq('status', 'active');

      if (senderError) throw senderError;

      if (!senderThreads || senderThreads.length === 0) {
        return null;
      }

      const senderThreadIds = senderThreads.map(t => t.thread_id);

      // Then find threads where receiver is also a participant
      const { data: mutualThreads, error: mutualError } = await supabaseAdmin
        .from('message_participants')
        .select('thread_id')
        .eq('user_id', receiverId)
        .eq('status', 'active')
        .in('thread_id', senderThreadIds);

      if (mutualError) throw mutualError;

      if (mutualThreads && mutualThreads.length > 0) {
        // Return the first mutual thread (most recent should be first)
        return { thread_id: mutualThreads[0].thread_id };
      }

      return null;

    } catch (error) {
      console.error('❌ Error finding existing thread:', error);
      return null;
    }
  }

  // Check if user can send message (reply restriction logic)
  // Logic: First message from initiator -> recipient must reply once to unlock free messaging
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

      // Find the original initiator (first message sender)
      const initiator = messages[0].sender_id;

      // Check if there's at least one message from the other person (recipient)
      const hasRecipientReplied = messages.some(msg => msg.sender_id !== initiator);

      if (hasRecipientReplied) {
        // Recipient has replied at least once - free messaging unlocked
        return true;
      }

      // Recipient hasn't replied yet
      if (senderId === initiator) {
        // Initiator trying to send more messages before reply - not allowed
        return false;
      } else {
        // Recipient can reply
        return true;
      }

    } catch (error) {
      console.error('❌ Error checking send permission:', error);
      // Default to allowing send to avoid blocking in case of error
      return true;
    }
  }

  // Get reply status for a thread (for UI display)
  async getReplyStatus(threadId, userId) {
    try {
      // Get all messages in thread
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        return {
          can_send: true,
          awaiting_reply: false,
          conversation_unlocked: false,
          last_message_from_user: false,
          last_message_at: null
        };
      }

      const initiator = messages[0].sender_id;
      const hasRecipientReplied = messages.some(msg => msg.sender_id !== initiator);
      const lastMessage = messages[messages.length - 1];

      // Check if this user can send
      let canSend = true;
      if (!hasRecipientReplied && userId === initiator) {
        // Initiator waiting for reply
        canSend = false;
      }

      return {
        can_send: canSend,
        awaiting_reply: !canSend,
        conversation_unlocked: hasRecipientReplied,
        last_message_from_user: lastMessage.sender_id === userId,
        last_message_at: lastMessage.created_at,
        is_initiator: userId === initiator
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
      // Generate new thread ID
      const threadId = crypto.randomUUID();

      // Create the first message directly (no database function needed)
      const { data: messageData, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          activity_id: threadData.activityId || null,
          sender_id: threadData.senderId,
          receiver_id: threadData.receiverId,
          subject: threadData.subject || 'New Message',
          content: threadData.content,
          message_type: threadData.messageType || 'general',
          context_type: threadData.contextType || 'general',
          context_id: threadData.contextId || null,
          thread_id: threadId
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Add participants to the thread
      const { error: participantsError } = await supabaseAdmin
        .from('message_participants')
        .insert([
          { thread_id: threadId, user_id: threadData.senderId },
          { thread_id: threadId, user_id: threadData.receiverId }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
      }

      // Create notification for receiver
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: threadData.receiverId,
            type: 'new_message',
            title: `新消息: ${threadData.subject || 'New Message'}`,
            content: '您收到了一条新消息',
            data: {
              message_id: messageData.id,
              thread_id: threadId,
              activity_id: threadData.activityId,
              sender_id: threadData.senderId
            },
            priority: 'medium'
          });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }

      // Get the created message with user details
      const latestMessage = await this.getLatestMessageInThread(threadId);

      // Send real-time notification
      if (socketManager && latestMessage) {
        socketManager.sendMessageToThread(threadId, latestMessage);
      }

      return {
        message: latestMessage,
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
        .select('*')
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

      // First, get all thread IDs for the user
      const { data: participantData, error: participantError } = await supabaseAdmin
        .from('message_participants')
        .select('thread_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        return {
          threads: [],
          pagination: { current_page: page, per_page: limit, total: 0, total_pages: 0 }
        };
      }

      const threadIds = participantData.map(p => p.thread_id);

      // Now get messages for these threads
      const { data: messagesData, error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .in('thread_id', threadIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const userIds = new Set();
      (messagesData || []).forEach(m => {
        if (m.sender_id) userIds.add(m.sender_id);
        if (m.receiver_id) userIds.add(m.receiver_id);
      });
      const userMap = await this.fetchUsersMap([...userIds]);

      // Group messages by thread
      const threadData = participantData.map(p => ({
        thread_id: p.thread_id,
        messages: messagesData.filter(m => m.thread_id === p.thread_id)
      }));

      // Filter by specific user if requested
      if (with_user_id) {
        // Find threads that include both users
        const { data: mutualThreads, error: mutualError } = await supabaseAdmin
          .from('message_participants')
          .select('thread_id')
          .eq('user_id', with_user_id)
          .eq('status', 'active');

        if (mutualError) throw mutualError;

        const mutualThreadIds = new Set(mutualThreads.map(t => t.thread_id));

        // Filter threadData to only include mutual threads
        const filteredThreadData = threadData.filter(t => mutualThreadIds.has(t.thread_id));

        if (filteredThreadData.length === 0) {
          // No mutual threads found
          return {
            threads: [],
            pagination: { current_page: page, per_page: limit, total: 0, total_pages: 0 }
          };
        }

        // Use filtered data
        const threads = this.processThreadSummaries(filteredThreadData, userId, userMap);
        return {
          threads: threads || [],
          pagination: {
            current_page: page,
            per_page: limit,
            total: threads?.length || 0,
            total_pages: Math.ceil((threads?.length || 0) / limit)
          }
        };
      }

      // Process threads to get thread summary
      const processedThreads = this.processThreadSummaries(threadData, userId, userMap);

      return {
        threads: processedThreads || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: processedThreads?.length || 0,
          total_pages: Math.ceil((processedThreads?.length || 0) / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessageThreads service:', error);
      throw error;
    }
  }

  // Process thread summaries
  processThreadSummaries(threadData, currentUserId, userMap = new Map()) {
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
      let otherParticipant = null;
      if (lastMessage) {
        const otherUserId = lastMessage.sender_id === currentUserId
          ? lastMessage.receiver_id
          : lastMessage.sender_id;
        otherParticipant = otherUserId ? userMap.get(otherUserId) || { id: otherUserId } : null;
      }

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
          *
        `, { count: 'exact' })
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const userIds = new Set();
      (messages || []).forEach(msg => {
        if (msg.sender_id) userIds.add(msg.sender_id);
        if (msg.receiver_id) userIds.add(msg.receiver_id);
      });
      const userMap = await this.fetchUsersMap([...userIds]);

      const enrichedMessages = (messages || []).map(msg => this.enrichMessageWithUsers(msg, userMap));

      return {
        messages: enrichedMessages,
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
      const { data: canSend, error: canSendError } = await supabaseAdmin
        .rpc('can_user_send_message', {
          thread_id_param: threadId,
          user_id_param: userId
        });

      let finalCanSend = canSend;
      if (canSendError) {
        if (this.isMissingCanSendMessageFunction(canSendError)) {
          console.warn('⚠️ can_user_send_message RPC unavailable, using service fallback logic');
          finalCanSend = await this.checkCanSendMessage(threadId, userId);
        } else {
          throw canSendError;
        }
      }

      if (!finalCanSend) {
        throw new Error('REPLY_REQUIRED: You must wait for the recipient to reply before sending more messages');
      }

      // Use the database function to create reply
      const { data: messageId, error: replyError } = await supabaseAdmin
        .rpc('reply_to_universal_message_thread', {
          thread_id_param: threadId,
          sender_id_param: userId,
          content_param: content,
          reply_to_param: replyToId
        });

      if (replyError) throw replyError;

      // Get the created message with user details
      const enrichedMessage = await this.getMessageWithUserDetails(messageId);

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
        .select('*')
        .eq('id', messageId)
        .single();

      if (error) throw error;

      const userMap = await this.fetchUsersMap([message.sender_id, message.receiver_id]);
      return this.enrichMessageWithUsers(message, userMap);

    } catch (error) {
      console.error('❌ Error getting message with user details:', error);
      throw error;
    }
  }

  async getLatestMessageInThread(threadId) {
    try {
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      const userMap = await this.fetchUsersMap([message.sender_id, message.receiver_id]);
      return this.enrichMessageWithUsers(message, userMap);
    } catch (error) {
      console.error('❌ Error getting latest message for thread:', error);
      throw error;
    }
  }

  async fetchUsersMap(userIds = []) {
    const ids = [...new Set(userIds)].filter(Boolean);
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', ids);

    if (error) throw error;

    const map = new Map();
    data?.forEach(user => {
      map.set(user.id, user);
    });
    return map;
  }

  enrichMessageWithUsers(message, userMap) {
    if (!message) return null;

    const sender = userMap.get(message.sender_id);
    const receiver = userMap.get(message.receiver_id);

    return {
      ...message,
      sender_first_name: sender?.first_name || null,
      sender_last_name: sender?.last_name || null,
      sender_avatar_url: sender?.avatar_url || null,
      sender_email: sender?.email || null,
      receiver_first_name: receiver?.first_name || null,
      receiver_last_name: receiver?.last_name || null,
      receiver_avatar_url: receiver?.avatar_url || null,
      receiver_email: receiver?.email || null,
      sender,
      receiver
    };
  }

  // =====================
  // User Blocking Features
  // =====================

  // Block a user
  async blockUser(blockerId, blockedId, reason = null) {
    try {
      if (blockerId === blockedId) {
        throw new Error('Cannot block yourself');
      }

      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
          reason: reason
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('User is already blocked');
        }
        throw error;
      }

      console.log(`🚫 User ${blockerId} blocked user ${blockedId}`);

      return {
        success: true,
        block: data
      };

    } catch (error) {
      console.error('❌ Error blocking user:', error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(blockerId, blockedId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Block relationship not found');
      }

      console.log(`✅ User ${blockerId} unblocked user ${blockedId}`);

      return {
        success: true,
        unblocked: true
      };

    } catch (error) {
      console.error('❌ Error unblocking user:', error);
      throw error;
    }
  }

  // Check if a user is blocked
  async isUserBlocked(blockerId, blockedId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return !!data;

    } catch (error) {
      console.error('❌ Error checking block status:', error);
      return false;
    }
  }

  // Check if messaging is blocked between two users (either direction)
  async isMessagingBlocked(userId1, userId2) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .select('id, blocker_id, blocked_id')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`);

      if (error) throw error;

      if (data && data.length > 0) {
        const block = data[0];
        return {
          blocked: true,
          blockedBy: block.blocker_id === userId1 ? 'self' : 'other',
          blockerId: block.blocker_id
        };
      }

      return {
        blocked: false
      };

    } catch (error) {
      console.error('❌ Error checking messaging block status:', error);
      return { blocked: false };
    }
  }

  // Get list of blocked users
  async getBlockedUsers(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .select(`
          id,
          blocked_id,
          reason,
          created_at
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details for blocked users
      if (data && data.length > 0) {
        const blockedIds = data.map(b => b.blocked_id);
        const userMap = await this.fetchUsersMap(blockedIds);

        return data.map(block => ({
          ...block,
          blocked_user: userMap.get(block.blocked_id) || null
        }));
      }

      return [];

    } catch (error) {
      console.error('❌ Error getting blocked users:', error);
      throw error;
    }
  }

  // Get list of users who blocked this user
  async getBlockedByUsers(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_blocks')
        .select('blocker_id, created_at')
        .eq('blocked_id', userId);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Error getting blocked by users:', error);
      throw error;
    }
  }

  // =====================
  // Message Reactions
  // =====================

  // Add a reaction to a message
  async addReaction(userId, messageId, emoji) {
    try {
      // First, get the message to verify access
      const { data: message, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('id, sender_id, receiver_id, reactions')
        .eq('id', messageId)
        .single();

      if (msgError || !message) {
        throw new Error('Message not found');
      }

      // Check if user has access to this message
      if (message.sender_id !== userId && message.receiver_id !== userId) {
        throw new Error('Access denied to this message');
      }

      // Get existing reactions or initialize empty array
      let reactions = message.reactions || [];

      // Check if user already reacted with this emoji
      const existingReactionIndex = reactions.findIndex(
        r => r.user_id === userId && r.emoji === emoji
      );

      if (existingReactionIndex >= 0) {
        // User already reacted with this emoji, just return success
        return {
          messageId,
          reactions: this.aggregateReactions(reactions)
        };
      }

      // Add new reaction
      reactions.push({
        user_id: userId,
        emoji: emoji,
        created_at: new Date().toISOString()
      });

      // Update the message with new reactions
      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          reactions: reactions,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select('id, reactions')
        .single();

      if (updateError) throw updateError;

      return {
        messageId,
        reactions: this.aggregateReactions(updatedMessage.reactions || [])
      };

    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      throw error;
    }
  }

  // Remove a reaction from a message
  async removeReaction(userId, messageId, emoji) {
    try {
      // First, get the message to verify access
      const { data: message, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('id, sender_id, receiver_id, reactions')
        .eq('id', messageId)
        .single();

      if (msgError || !message) {
        throw new Error('Message not found');
      }

      // Check if user has access to this message
      if (message.sender_id !== userId && message.receiver_id !== userId) {
        throw new Error('Access denied to this message');
      }

      // Get existing reactions or initialize empty array
      let reactions = message.reactions || [];

      // Remove the user's reaction with this emoji
      reactions = reactions.filter(
        r => !(r.user_id === userId && r.emoji === emoji)
      );

      // Update the message with new reactions
      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          reactions: reactions,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select('id, reactions')
        .single();

      if (updateError) throw updateError;

      return {
        messageId,
        reactions: this.aggregateReactions(updatedMessage.reactions || [])
      };

    } catch (error) {
      console.error('❌ Error removing reaction:', error);
      throw error;
    }
  }

  // Helper: Aggregate reactions for display (count by emoji)
  aggregateReactions(reactions) {
    const reactionMap = new Map();

    for (const reaction of reactions) {
      if (!reactionMap.has(reaction.emoji)) {
        reactionMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 0,
          users: []
        });
      }
      const entry = reactionMap.get(reaction.emoji);
      entry.count++;
      entry.users.push(reaction.user_id);
    }

    return Array.from(reactionMap.values());
  }
}

export default new MessageService();
