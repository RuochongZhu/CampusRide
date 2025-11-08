import pool from '../config/database.js';
import socketManager from '../config/socket.js';

class MessageService {
  // Send a new message
  async sendMessage(messageData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        activityId,
        senderId,
        receiverId,
        subject,
        content,
        messageType = 'activity_inquiry',
        priority = 'normal'
      } = messageData;

      // Check if activity exists and sender has permission
      const activityCheck = await client.query(
        `SELECT id, organizer_id, title
         FROM activities
         WHERE id = $1 AND status != 'deleted'`,
        [activityId]
      );

      if (activityCheck.rows.length === 0) {
        throw new Error('Activity not found');
      }

      const activity = activityCheck.rows[0];

      // Use the database function to create message thread
      const result = await client.query(
        `SELECT create_message_thread($1, $2, $3, $4, $5, $6) as thread_id`,
        [activityId, senderId, receiverId, subject, content, messageType]
      );

      const threadId = result.rows[0].thread_id;

      // Get the created message details
      const messageQuery = await client.query(
        `SELECT m.*,
                sender.first_name as sender_first_name,
                sender.last_name as sender_last_name,
                receiver.first_name as receiver_first_name,
                receiver.last_name as receiver_last_name,
                a.title as activity_title
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         JOIN users receiver ON m.receiver_id = receiver.id
         JOIN activities a ON m.activity_id = a.id
         WHERE m.thread_id = $1
         ORDER BY m.created_at DESC
         LIMIT 1`,
        [threadId]
      );

      await client.query('COMMIT');

      const message = messageQuery.rows[0];

      // Send real-time notification via Socket.IO
      socketManager.sendMessageToThread(threadId, message);

      return {
        message: message,
        threadId: threadId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in sendMessage service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get messages for a user
  async getMessages(userId, filters) {
    const client = await pool.connect();

    try {
      const { page, limit, type, unreadOnly } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = ['m.status = $1'];
      let queryParams = ['active'];
      let paramCount = 1;

      // Filter by message type (sent/received/all)
      if (type === 'sent') {
        whereConditions.push(`m.sender_id = $${++paramCount}`);
        queryParams.push(userId);
      } else if (type === 'received') {
        whereConditions.push(`m.receiver_id = $${++paramCount}`);
        queryParams.push(userId);
      } else {
        // All messages (sent or received)
        whereConditions.push(`(m.sender_id = $${++paramCount} OR m.receiver_id = $${++paramCount})`);
        queryParams.push(userId, userId);
      }

      // Filter unread only
      if (unreadOnly && type !== 'sent') {
        whereConditions.push(`m.receiver_id = $${++paramCount} AND m.is_read = false`);
        queryParams.push(userId);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get messages with user and activity details
      const messagesQuery = `
        SELECT m.*,
               sender.first_name as sender_first_name,
               sender.last_name as sender_last_name,
               receiver.first_name as receiver_first_name,
               receiver.last_name as receiver_last_name,
               a.title as activity_title
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        JOIN activities a ON m.activity_id = a.id
        WHERE ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      queryParams.push(limit, offset);

      const messages = await client.query(messagesQuery, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM messages m
        JOIN activities a ON m.activity_id = a.id
        WHERE ${whereClause}
      `;

      const countParams = queryParams.slice(0, paramCount - 2); // Remove limit and offset
      const countResult = await client.query(countQuery, countParams);

      return {
        messages: messages.rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessages service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get message threads for a user
  async getMessageThreads(userId, filters) {
    const client = await pool.connect();

    try {
      const { page, limit } = filters;
      const offset = (page - 1) * limit;

      const threadsQuery = `
        WITH thread_summary AS (
          SELECT
            m.thread_id,
            m.activity_id,
            MAX(m.created_at) as last_message_time,
            COUNT(*) as message_count,
            COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = false THEN 1 END) as unread_count,
            (SELECT m2.subject FROM messages m2 WHERE m2.thread_id = m.thread_id ORDER BY m2.created_at ASC LIMIT 1) as subject,
            (SELECT m2.content FROM messages m2 WHERE m2.thread_id = m.thread_id ORDER BY m2.created_at DESC LIMIT 1) as last_message,
            (SELECT m2.sender_id FROM messages m2 WHERE m2.thread_id = m.thread_id ORDER BY m2.created_at DESC LIMIT 1) as last_sender_id
          FROM messages m
          JOIN message_participants mp ON m.thread_id = mp.thread_id
          WHERE mp.user_id = $1 AND mp.status = 'active' AND m.status = 'active'
          GROUP BY m.thread_id, m.activity_id
        )
        SELECT
          ts.*,
          a.title as activity_title,
          a.organizer_id,
          sender.first_name as last_sender_first_name,
          sender.last_name as last_sender_last_name,
          organizer.first_name as organizer_first_name,
          organizer.last_name as organizer_last_name
        FROM thread_summary ts
        JOIN activities a ON ts.activity_id = a.id
        JOIN users sender ON ts.last_sender_id = sender.id
        JOIN users organizer ON a.organizer_id = organizer.id
        ORDER BY ts.last_message_time DESC
        LIMIT $2 OFFSET $3
      `;

      const threads = await client.query(threadsQuery, [userId, limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT m.thread_id) as total
        FROM messages m
        JOIN message_participants mp ON m.thread_id = mp.thread_id
        WHERE mp.user_id = $1 AND mp.status = 'active' AND m.status = 'active'
      `;

      const countResult = await client.query(countQuery, [userId]);

      return {
        threads: threads.rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getMessageThreads service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get messages in a specific thread
  async getThreadMessages(userId, threadId, filters) {
    const client = await pool.connect();

    try {
      // Check if user is participant in this thread
      const participantCheck = await client.query(
        'SELECT * FROM message_participants WHERE thread_id = $1 AND user_id = $2 AND status = $3',
        [threadId, userId, 'active']
      );

      if (participantCheck.rows.length === 0) {
        throw new Error('Access denied: User is not a participant in this thread');
      }

      const { page, limit } = filters;
      const offset = (page - 1) * limit;

      const messagesQuery = `
        SELECT m.*,
               sender.first_name as sender_first_name,
               sender.last_name as sender_last_name,
               receiver.first_name as receiver_first_name,
               receiver.last_name as receiver_last_name,
               a.title as activity_title
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        JOIN activities a ON m.activity_id = a.id
        WHERE m.thread_id = $1 AND m.status = 'active'
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const messages = await client.query(messagesQuery, [threadId, limit, offset]);

      // Get total count
      const countResult = await client.query(
        'SELECT COUNT(*) as total FROM messages WHERE thread_id = $1 AND status = $2',
        [threadId, 'active']
      );

      return {
        messages: messages.rows,
        threadId: threadId,
        pagination: {
          current_page: page,
          per_page: limit,
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Error in getThreadMessages service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Reply to a message thread
  async replyToThread(userId, threadId, content, replyToId = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user is participant in this thread
      const participantCheck = await client.query(
        'SELECT * FROM message_participants WHERE thread_id = $1 AND user_id = $2 AND status = $3',
        [threadId, userId, 'active']
      );

      if (participantCheck.rows.length === 0) {
        throw new Error('Access denied: User is not a participant in this thread');
      }

      // Use the database function to reply to thread
      const result = await client.query(
        'SELECT reply_to_message_thread($1, $2, $3, $4) as message_id',
        [threadId, userId, content, replyToId]
      );

      const messageId = result.rows[0].message_id;

      // Get the created message details
      const messageQuery = await client.query(
        `SELECT m.*,
                sender.first_name as sender_first_name,
                sender.last_name as sender_last_name,
                receiver.first_name as receiver_first_name,
                receiver.last_name as receiver_last_name,
                a.title as activity_title
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         JOIN users receiver ON m.receiver_id = receiver.id
         JOIN activities a ON m.activity_id = a.id
         WHERE m.id = $1`,
        [messageId]
      );

      await client.query('COMMIT');

      const newMessage = messageQuery.rows[0];

      // Send real-time notification via Socket.IO
      socketManager.sendMessageToThread(threadId, newMessage);

      return newMessage;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in replyToThread service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mark thread as read
  async markThreadAsRead(userId, threadId) {
    const client = await pool.connect();

    try {
      // Use the database function to mark messages as read
      const result = await client.query(
        'SELECT mark_messages_as_read($1, $2) as updated_count',
        [threadId, userId]
      );

      return {
        updatedCount: result.rows[0].updated_count,
        threadId: threadId
      };

    } catch (error) {
      console.error('❌ Error in markThreadAsRead service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId) {
    const client = await pool.connect();

    try {
      // Use the database function to get unread count
      const result = await client.query(
        'SELECT get_unread_message_count($1) as count',
        [userId]
      );

      return parseInt(result.rows[0].count) || 0;

    } catch (error) {
      console.error('❌ Error in getUnreadCount service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete a message (soft delete)
  async deleteMessage(userId, messageId) {
    const client = await pool.connect();

    try {
      // Check if user is the sender of this message
      const messageCheck = await client.query(
        'SELECT * FROM messages WHERE id = $1 AND sender_id = $2 AND status = $3',
        [messageId, userId, 'active']
      );

      if (messageCheck.rows.length === 0) {
        throw new Error('Message not found or access denied');
      }

      // Soft delete the message
      const result = await client.query(
        `UPDATE messages
         SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND sender_id = $2`,
        [messageId, userId]
      );

      return {
        messageId: messageId,
        deleted: result.rowCount > 0
      };

    } catch (error) {
      console.error('❌ Error in deleteMessage service:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Archive a message
  async archiveMessage(userId, messageId) {
    const client = await pool.connect();

    try {
      // Check if user is sender or receiver of this message
      const messageCheck = await client.query(
        'SELECT * FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) AND status = $3',
        [messageId, userId, 'active']
      );

      if (messageCheck.rows.length === 0) {
        throw new Error('Message not found or access denied');
      }

      // Archive the message
      const result = await client.query(
        `UPDATE messages
         SET status = 'archived', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`,
        [messageId, userId]
      );

      return {
        messageId: messageId,
        archived: result.rowCount > 0
      };

    } catch (error) {
      console.error('❌ Error in archiveMessage service:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new MessageService();