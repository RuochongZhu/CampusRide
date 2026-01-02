import { supabaseAdmin } from '../config/database.js';

/**
 * Execute raw SQL query using Supabase RPC
 * This bypasses PostgREST schema cache issues
 */
export async function executeRawSQL(query, params = []) {
  try {
    // Create a function call that executes raw SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      query_text: query,
      params_array: params
    });

    if (error) {
      console.error('Raw SQL execution error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    console.error('Raw SQL execution failed:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new marketplace conversation
 */
export async function createMarketplaceConversation({ itemId, buyerId, sellerId }) {
  const query = `
    INSERT INTO marketplace_conversations (item_id, buyer_id, seller_id, status)
    VALUES ($1, $2, $3, 'active')
    ON CONFLICT (item_id, buyer_id, seller_id)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  try {
    // Use direct SQL via pg library if available, or fall back to Supabase client
    const { data, error } = await supabaseAdmin
      .rpc('create_conversation', {
        p_item_id: itemId,
        p_buyer_id: buyerId,
        p_seller_id: sellerId
      });

    if (error) {
      console.error('❌ RPC create_conversation error:', error);
      // Fall back to direct insert
      return await directInsertConversation({ itemId, buyerId, sellerId });
    }

    return { data, error: null };
  } catch (err) {
    console.error('❌ Create conversation failed:', err);
    return await directInsertConversation({ itemId, buyerId, sellerId });
  }
}

/**
 * Direct insert conversation using raw SQL connection
 */
async function directInsertConversation({ itemId, buyerId, sellerId }) {
  // Use Supabase's REST API directly
  const { data, error } = await supabaseAdmin
    .from('marketplace_conversations')
    .insert({
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: sellerId,
      status: 'active'
    })
    .select('id')
    .single();

  return { data, error };
}

/**
 * Create a new marketplace message
 */
export async function createMarketplaceMessage({ conversationId, senderId, message, messageType = 'reply' }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('marketplace_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message: message.trim(),
        message_type: messageType
      })
      .select(`
        id,
        message,
        message_type,
        created_at,
        sender_id
      `)
      .single();

    return { data, error };
  } catch (err) {
    console.error('❌ Create message failed:', err);
    return { data: null, error: err };
  }
}

export default {
  executeRawSQL,
  createMarketplaceConversation,
  createMarketplaceMessage
};
