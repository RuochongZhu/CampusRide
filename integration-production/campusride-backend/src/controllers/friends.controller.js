import { supabaseAdmin } from '../config/database.js';

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('user_friends')
      .select(`
        id,
        friend_id,
        status,
        created_at,
        friend:users!user_friends_friend_id_fkey (
          id, email, first_name, last_name, avatar_url,
          avg_rating, total_carpools, total_activities, total_sales, points
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting friends:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to get friends list' }
      });
    }

    res.json({
      success: true,
      data: data.map(f => ({
        ...f.friend,
        friendship_id: f.id,
        friend_since: f.created_at
      }))
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Add friend (send request with optional intro message)
export const addFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.userId;
    const { intro_message } = req.body || {};

    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add yourself as friend' }
      });
    }

    // Check if friendship already exists
    const { data: existing } = await supabaseAdmin
      .from('user_friends')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: { message: 'Already friends' }
        });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: { message: 'Friend request already pending' }
        });
      }
    }

    // Create friend request with intro message
    const { data, error } = await supabaseAdmin
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
        intro_message: intro_message || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding friend:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to send friend request' }
      });
    }

    // If there's an intro message, also create a message thread
    if (intro_message) {
      try {
        await supabaseAdmin
          .from('messages')
          .insert({
            sender_id: userId,
            receiver_id: friendId,
            subject: 'Friend Request',
            content: intro_message,
            message_type: 'friend_request',
            context_type: 'friend_request',
            context_id: data.id
          });
      } catch (msgError) {
        console.error('Failed to create intro message:', msgError);
        // Don't fail the friend request if message fails
      }
    }

    res.json({
      success: true,
      data,
      message: intro_message ? 'Friend request sent with message' : 'Friend request sent'
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.userId;

    const { error } = await supabaseAdmin
      .from('user_friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    if (error) {
      console.error('Error removing friend:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to remove friend' }
      });
    }

    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Check friend status
export const checkFriendStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.userId;

    const { data } = await supabaseAdmin
      .from('user_friends')
      .select('id, status, user_id')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    res.json({
      success: true,
      data: {
        is_friend: data?.status === 'accepted',
        is_pending: data?.status === 'pending',
        request_sent_by_me: data?.user_id === userId,
        friendship_id: data?.id || null
      }
    });
  } catch (error) {
    console.error('Check friend status error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('user_friends')
      .select(`
        id,
        user_id,
        status,
        created_at,
        requester:users!user_friends_user_id_fkey (
          id, email, first_name, last_name, avatar_url,
          avg_rating, total_carpools, total_activities, total_sales, points
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting friend requests:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to get friend requests' }
      });
    }

    res.json({
      success: true,
      data: data.map(r => ({
        request_id: r.id,
        ...r.requester,
        requested_at: r.created_at
      }))
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    const { data, error } = await supabaseAdmin
      .from('user_friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Friend request not found' }
      });
    }

    // Create reverse friendship
    await supabaseAdmin
      .from('user_friends')
      .upsert({
        user_id: userId,
        friend_id: data.user_id,
        status: 'accepted'
      });

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    const { error } = await supabaseAdmin
      .from('user_friends')
      .delete()
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Friend request not found' }
      });
    }

    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};
