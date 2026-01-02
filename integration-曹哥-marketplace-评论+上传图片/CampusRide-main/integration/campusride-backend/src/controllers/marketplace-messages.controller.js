import { supabaseAdmin } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import socketManager from '../config/socket.js';

/**
 * Start a conversation about a marketplace item
 */
export const startItemConversation = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { message } = req.body;
    const buyerId = req.user?.id;

    // Validation
    if (!buyerId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!message || message.trim().length === 0) {
      throw new AppError('Message content is required', 400, 'MESSAGE_REQUIRED');
    }

    if (message.length > 1000) {
      throw new AppError('Message too long (max 1000 characters)', 400, 'MESSAGE_TOO_LONG');
    }

    // Verify item exists and is active
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, title, seller_id, status')
      .eq('id', itemId)
      .eq('status', 'active')
      .single();

    if (itemError || !item) {
      throw new AppError('Item not found or not available', 404, 'ITEM_NOT_FOUND');
    }

    // Check if user is not the seller
    if (item.seller_id === buyerId) {
      throw new AppError('Cannot message yourself', 400, 'CANNOT_MESSAGE_SELF');
    }

    // Use RPC function to create or get existing conversation (bypasses PostgREST cache)
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .rpc('create_marketplace_conversation', {
        p_item_id: itemId,
        p_buyer_id: buyerId,
        p_seller_id: item.seller_id
      })
      .single();

    if (conversationError || !conversation) {
      console.error('❌ Conversation creation error details:', {
        code: conversationError?.code,
        message: conversationError?.message,
        details: conversationError?.details,
        hint: conversationError?.hint,
        fullError: conversationError
      });
      throw new AppError('Failed to create conversation', 500, 'CREATE_CONVERSATION_FAILED');
    }

    const conversationId = conversation.id;

    // Send the first message using RPC function
    const { data: sentMessage, error: messageError } = await supabaseAdmin
      .rpc('create_marketplace_message', {
        p_conversation_id: conversationId,
        p_sender_id: buyerId,
        p_message: message.trim(),
        p_message_type: 'inquiry'
      })
      .single();

    if (messageError || !sentMessage) {
      console.error('❌ Message creation error:', messageError);
      throw new AppError('Failed to send message', 500, 'SEND_MESSAGE_FAILED');
    }

    // Get sender info
    const sender = {
      id: req.user.id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      avatar_url: req.user.avatar_url
    };

    // Add sender info to message
    sentMessage.sender = sender;

    // Send real-time notification to seller about new conversation
    socketManager.notifyNewMarketplaceConversation(item.seller_id, {
      conversationId,
      item: { id: item.id, title: item.title },
      buyer: { id: buyerId, name: `${req.user.first_name} ${req.user.last_name}` },
      message: sentMessage
    });

    res.status(201).json({
      success: true,
      data: {
        conversationId,
        message: sentMessage,
        item: {
          id: item.id,
          title: item.title
        }
      },
      message: 'Conversation started successfully'
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start conversation'
    });
  }
};

/**
 * Send a message in an existing conversation
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!message || message.trim().length === 0) {
      throw new AppError('Message content is required', 400, 'MESSAGE_REQUIRED');
    }

    if (message.length > 1000) {
      throw new AppError('Message too long (max 1000 characters)', 400, 'MESSAGE_TOO_LONG');
    }

    // Verify conversation exists and user is participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id, buyer_id, seller_id, status')
      .eq('id', conversationId)
      .eq('status', 'active')
      .single();

    if (convError || !conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Check if user is participant
    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    // Send message
    const { data: sentMessage, error: messageError } = await supabaseAdmin
      .from('marketplace_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: message.trim(),
        message_type: 'reply'
      })
      .select(`
        id,
        message,
        message_type,
        created_at,
        sender:auth.users!marketplace_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (messageError) {
      throw new AppError('Failed to send message', 500, 'SEND_MESSAGE_FAILED');
    }

    // Send real-time message to conversation participants
    socketManager.sendMarketplaceMessage(conversationId, sentMessage);

    // Notify the other participant
    const otherUserId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    socketManager.sendNotificationToUser(otherUserId, {
      type: 'marketplace_message',
      data: sentMessage,
      conversationId: conversationId,
      message: 'You have a new message'
    });

    res.status(201).json({
      success: true,
      data: sentMessage,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to send message'
    });
  }
};

/**
 * Get conversations for current user
 */
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const offset = (page - 1) * limit;

    // Get conversations where user is buyer or seller
    const { data: conversations, error, count } = await supabaseAdmin
      .from('marketplace_conversations')
      .select(`
        id,
        created_at,
        status,
        buyer_id,
        seller_id,
        item:marketplace_items!marketplace_conversations_item_id_fkey(
          id,
          title,
          price,
          images,
          status
        ),
        buyer:auth.users!marketplace_conversations_buyer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        seller:auth.users!marketplace_conversations_seller_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        latest_message:marketplace_messages(
          id,
          message,
          created_at,
          sender_id,
          message_type
        )
      `, { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch conversations', 500, 'FETCH_CONVERSATIONS_FAILED');
    }

    // Process conversations to get latest message and unread count
    const processedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get latest message
        const { data: latestMessage } = await supabaseAdmin
          .from('marketplace_messages')
          .select(`
            id,
            message,
            created_at,
            sender_id,
            message_type,
            sender:auth.users!marketplace_messages_sender_id_fkey(
              id,
              first_name,
              last_name
            )
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for current user
        const { data: unreadMessages, count: unreadCount } = await supabaseAdmin
          .from('marketplace_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .eq('is_read', false);

        return {
          ...conv,
          latest_message: latestMessage,
          unread_count: unreadCount || 0,
          other_user: conv.buyer_id === userId ? conv.seller : conv.buyer
        };
      })
    );

    res.status(200).json({
      success: true,
      data: processedConversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get conversations'
    });
  }
};

/**
 * Get messages in a conversation
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id, buyer_id, seller_id, item_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    const offset = (page - 1) * limit;

    // Get messages
    const { data: messages, error, count } = await supabaseAdmin
      .from('marketplace_messages')
      .select(`
        id,
        message,
        message_type,
        created_at,
        sender_id,
        is_read,
        sender:auth.users!marketplace_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch messages', 500, 'FETCH_MESSAGES_FAILED');
    }

    // Mark messages as read for current user
    await supabaseAdmin
      .from('marketplace_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    res.status(200).json({
      success: true,
      data: {
        messages,
        conversation_id: conversationId,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get messages'
    });
  }
};

/**
 * Get unread message count for marketplace conversations
 */
export const getUnreadMessagesCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Get all conversations for user
    const { data: conversations } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'active');

    if (!conversations || conversations.length === 0) {
      return res.status(200).json({
        success: true,
        data: { count: 0 }
      });
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages across all conversations
    const { data: unreadMessages, count } = await supabaseAdmin
      .from('marketplace_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    res.status(200).json({
      success: true,
      data: { count: count || 0 }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get unread count'
    });
  }
};

export default {
  startItemConversation,
  sendMessage,
  getUserConversations,
  getConversationMessages,
  getUnreadMessagesCount
};