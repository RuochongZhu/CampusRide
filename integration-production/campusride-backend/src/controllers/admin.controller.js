import { supabaseAdmin } from '../config/database.js';

// Admin email that has access to admin panel
const ADMIN_EMAILS = ['rz469@cornell.edu'];

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Admin access required' }
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0);
    }

    const startDateStr = startDate.toISOString();

    // Get counts
    const [ridesResult, marketplaceResult, activitiesResult, usersResult, pointsResult] = await Promise.all([
      // Rides count
      supabaseAdmin
        .from('rides')
        .select('id', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Marketplace items count
      supabaseAdmin
        .from('marketplace_items')
        .select('id', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Activities count
      supabaseAdmin
        .from('activities')
        .select('id', { count: 'exact' })
        .gte('created_at', startDateStr),

      // New users count
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Total points awarded
      supabaseAdmin
        .from('point_transactions')
        .select('points')
        .gte('created_at', startDateStr)
        .eq('transaction_type', 'earn')
    ]);

    const totalPointsAwarded = pointsResult.data?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        period,
        stats: {
          rides: ridesResult.count || 0,
          marketplace_items: marketplaceResult.count || 0,
          activities: activitiesResult.count || 0,
          new_users: usersResult.count || 0,
          points_awarded: totalPointsAwarded
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get dashboard stats' }
    });
  }
};

// Get ride statistics
export const getRideStats = async (req, res) => {
  try {
    const { start_date, end_date, period = 'week' } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          endDate = new Date();
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
    }

    // Get rides with privacy protection - only aggregate data, no personal details
    const { data: rides, error, count } = await supabaseAdmin
      .from('rides')
      .select(`
        id,
        status,
        price_per_seat,
        available_seats,
        created_at,
        departure_time
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate aggregates
    const statusCounts = rides.reduce((acc, ride) => {
      acc[ride.status] = (acc[ride.status] || 0) + 1;
      return acc;
    }, {});

    const avgPrice = rides.length > 0
      ? rides.reduce((sum, r) => sum + (r.price_per_seat || 0), 0) / rides.length
      : 0;

    res.json({
      success: true,
      data: {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        total: count || 0,
        status_breakdown: statusCounts,
        average_price: avgPrice.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get ride stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get ride stats' }
    });
  }
};

// Get marketplace statistics
export const getMarketplaceStats = async (req, res) => {
  try {
    const { start_date, end_date, period = 'week' } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          endDate = new Date();
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
    }

    // Get marketplace items - aggregate only
    const { data: items, error, count } = await supabaseAdmin
      .from('marketplace_items')
      .select(`
        id,
        status,
        price,
        category,
        condition,
        created_at
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate aggregates
    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const avgPrice = items.length > 0
      ? items.reduce((sum, i) => sum + (i.price || 0), 0) / items.length
      : 0;

    res.json({
      success: true,
      data: {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        total: count || 0,
        status_breakdown: statusCounts,
        category_breakdown: categoryCounts,
        average_price: avgPrice.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get marketplace stats' }
    });
  }
};

// Get activity statistics
export const getActivityStats = async (req, res) => {
  try {
    const { start_date, end_date, period = 'week' } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          endDate = new Date();
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
    }

    // Get activities - aggregate only
    const { data: activities, error, count } = await supabaseAdmin
      .from('activities')
      .select(`
        id,
        status,
        activity_type,
        current_participants,
        max_participants,
        created_at
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate aggregates
    const statusCounts = activities.reduce((acc, act) => {
      acc[act.status] = (acc[act.status] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = activities.reduce((acc, act) => {
      acc[act.activity_type] = (acc[act.activity_type] || 0) + 1;
      return acc;
    }, {});

    const totalParticipants = activities.reduce((sum, a) => sum + (a.current_participants || 0), 0);

    res.json({
      success: true,
      data: {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        total: count || 0,
        status_breakdown: statusCounts,
        type_breakdown: typeCounts,
        total_participants: totalParticipants
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get activity stats' }
    });
  }
};

// Get points leaderboard for admin
export const getPointsLeaderboard = async (req, res) => {
  try {
    const { start_date, end_date, period = 'week', limit = 50 } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          endDate = new Date();
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
    }

    // Get top users by points - only show necessary fields, mask email for privacy
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        points,
        total_carpools,
        total_activities,
        total_sales,
        is_banned
      `)
      .order('points', { ascending: false })
      .limit(parseInt(limit, 10));

    if (error) {
      throw error;
    }

    // Mask emails for privacy (only show domain)
    const maskedUsers = users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Anonymous',
      email_domain: u.email?.split('@')[1] || 'unknown',
      points: u.points || 0,
      total_carpools: u.total_carpools || 0,
      total_activities: u.total_activities || 0,
      total_sales: u.total_sales || 0,
      is_banned: u.is_banned || false
    }));

    res.json({
      success: true,
      data: {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        users: maskedUsers
      }
    });
  } catch (error) {
    console.error('Get points leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get points leaderboard' }
    });
  }
};

// Get user list for admin (with privacy protection)
export const getUserList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        points,
        is_banned,
        total_carpools,
        total_activities,
        total_sales
      `, { count: 'exact' });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          ...u,
          // Partially mask email for admin view
          email_masked: u.email?.replace(/(.{2}).+(@.+)/, '$1***$2')
        })),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Get user list error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user list' }
    });
  }
};

// Ban a user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Can't ban yourself
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot ban yourself' }
      });
    }

    // Check if target user exists and is not already banned
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_banned')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Can't ban other admins
    if (ADMIN_EMAILS.includes(targetUser.email)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot ban admin users' }
      });
    }

    // Update user to banned
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: reason || 'Banned by administrator'
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'ban',
        reason: reason || 'No reason provided'
      });

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to ban user' }
    });
  }
};

// Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: false,
        banned_at: null,
        ban_reason: null
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'unban',
        reason: 'User unbanned'
      });

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to unban user' }
    });
  }
};

// Admin delete ride
export const deleteRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if ride exists
    const { data: ride, error: findError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id')
      .eq('id', rideId)
      .single();

    if (findError || !ride) {
      return res.status(404).json({
        success: false,
        error: { message: 'Ride not found' }
      });
    }

    // Delete the ride
    const { error: deleteError } = await supabaseAdmin
      .from('rides')
      .delete()
      .eq('id', rideId);

    if (deleteError) {
      throw deleteError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: ride.driver_id,
        action: 'delete_ride',
        reason: reason || 'Ride deleted by administrator',
        metadata: { ride_id: rideId }
      });

    res.json({
      success: true,
      message: 'Ride deleted successfully'
    });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete ride' }
    });
  }
};

// Admin delete marketplace item
export const deleteMarketplaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if item exists
    const { data: item, error: findError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, seller_id')
      .eq('id', itemId)
      .single();

    if (findError || !item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Marketplace item not found' }
      });
    }

    // Delete the item
    const { error: deleteError } = await supabaseAdmin
      .from('marketplace_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      throw deleteError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: item.seller_id,
        action: 'delete_marketplace_item',
        reason: reason || 'Item deleted by administrator',
        metadata: { item_id: itemId }
      });

    res.json({
      success: true,
      message: 'Marketplace item deleted successfully'
    });
  } catch (error) {
    console.error('Delete marketplace item error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete marketplace item' }
    });
  }
};

// Admin delete activity
export const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if activity exists
    const { data: activity, error: findError } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id')
      .eq('id', activityId)
      .single();

    if (findError || !activity) {
      return res.status(404).json({
        success: false,
        error: { message: 'Activity not found' }
      });
    }

    // Delete the activity
    const { error: deleteError } = await supabaseAdmin
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (deleteError) {
      throw deleteError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: activity.organizer_id,
        action: 'delete_activity',
        reason: reason || 'Activity deleted by administrator',
        metadata: { activity_id: activityId }
      });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete activity' }
    });
  }
};

// Grant admin role to user
export const grantAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Can't grant to yourself
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot modify your own role' }
      });
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Update user role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: true,
        admin_granted_at: new Date().toISOString(),
        admin_granted_by: adminId
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'grant_admin',
        reason: 'Admin role granted'
      });

    res.json({
      success: true,
      message: 'Admin role granted successfully'
    });
  } catch (error) {
    console.error('Grant admin role error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to grant admin role' }
    });
  }
};

// Revoke admin role from user
export const revokeAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Can't revoke from yourself
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot revoke your own admin role' }
      });
    }

    // Check if user exists and is admin
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Can't revoke from original admins
    if (ADMIN_EMAILS.includes(targetUser.email)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot revoke role from original admin' }
      });
    }

    // Update user role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: false,
        admin_granted_at: null,
        admin_granted_by: null
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'revoke_admin',
        reason: 'Admin role revoked'
      });

    res.json({
      success: true,
      message: 'Admin role revoked successfully'
    });
  } catch (error) {
    console.error('Revoke admin role error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to revoke admin role' }
    });
  }
};

// Grant merchant role to user
export const grantMerchantRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { businessName, businessType } = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_merchant')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Update user role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_merchant: true,
        merchant_granted_at: new Date().toISOString(),
        merchant_granted_by: adminId,
        business_name: businessName || null,
        business_type: businessType || null
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'grant_merchant',
        reason: 'Merchant role granted',
        metadata: { business_name: businessName, business_type: businessType }
      });

    res.json({
      success: true,
      message: 'Merchant role granted successfully'
    });
  } catch (error) {
    console.error('Grant merchant role error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to grant merchant role' }
    });
  }
};

// Revoke merchant role from user
export const revokeMerchantRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Update user role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_merchant: false,
        merchant_granted_at: null,
        merchant_granted_by: null,
        business_name: null,
        business_type: null
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: userId,
        action: 'revoke_merchant',
        reason: 'Merchant role revoked'
      });

    res.json({
      success: true,
      message: 'Merchant role revoked successfully'
    });
  } catch (error) {
    console.error('Revoke merchant role error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to revoke merchant role' }
    });
  }
};

// Get all merchants list
export const getMerchantList = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { data: merchants, error, count } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        is_merchant,
        merchant_granted_at,
        business_name,
        business_type
      `, { count: 'exact' })
      .eq('is_merchant', true)
      .order('merchant_granted_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        merchants: merchants || [],
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Get merchant list error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get merchant list' }
    });
  }
};

// Send system announcement (creates a system message to all users)
export const sendSystemAnnouncement = async (req, res) => {
  try {
    const { title, content, priority = 'normal' } = req.body;
    const adminId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and content are required' }
      });
    }

    // Create system announcement
    const { data: announcement, error } = await supabaseAdmin
      .from('system_announcements')
      .insert({
        title,
        content,
        priority,
        created_by: adminId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action: 'send_announcement',
        reason: `Announcement: ${title}`,
        metadata: { announcement_id: announcement.id }
      });

    res.json({
      success: true,
      data: announcement,
      message: 'System announcement sent successfully'
    });
  } catch (error) {
    console.error('Send system announcement error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send system announcement' }
    });
  }
};

// Get system announcements
export const getSystemAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { data: announcements, error, count } = await supabaseAdmin
      .from('system_announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: {
        announcements: announcements || [],
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Get system announcements error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get system announcements' }
    });
  }
};

// Get all posts (rides, marketplace, activities) for admin management
export const getAllPosts = async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const results = {};

    if (type === 'all' || type === 'rides') {
      const { data: rides, count: ridesCount } = await supabaseAdmin
        .from('rides')
        .select(`
          id,
          departure_location,
          destination_location,
          departure_time,
          status,
          created_at,
          driver:driver_id (id, first_name, last_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1);

      results.rides = { data: rides || [], total: ridesCount || 0 };
    }

    if (type === 'all' || type === 'marketplace') {
      const { data: items, count: itemsCount } = await supabaseAdmin
        .from('marketplace_items')
        .select(`
          id,
          title,
          price,
          status,
          category,
          created_at,
          seller:seller_id (id, first_name, last_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1);

      results.marketplace = { data: items || [], total: itemsCount || 0 };
    }

    if (type === 'all' || type === 'activities') {
      const { data: activities, count: activitiesCount } = await supabaseAdmin
        .from('activities')
        .select(`
          id,
          title,
          status,
          category,
          start_time,
          end_time,
          created_at,
          organizer:organizer_id (id, first_name, last_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1);

      results.activities = { data: activities || [], total: activitiesCount || 0 };
    }

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get posts' }
    });
  }
};

// Distribute weekly coupons to top performers
export const distributeWeeklyCoupons = async (req, res) => {
  try {
    const { topN = 10 } = req.body;
    const adminId = req.user.id;

    // Import leaderboard service
    const leaderboardService = (await import('../services/leaderboard.service.js')).default;

    const result = await leaderboardService.distributeWeeklyCoupons(topN);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: { message: result.error || 'Failed to distribute coupons' }
      });
    }

    // Log the action
    await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action: 'distribute_coupons',
        reason: `Distributed ${result.couponsDistributed} coupons to top ${topN} users`,
        metadata: { topUsers: result.topUsers }
      });

    res.json({
      success: true,
      data: {
        couponsDistributed: result.couponsDistributed,
        topUsers: result.topUsers
      },
      message: `Successfully distributed ${result.couponsDistributed} coupons`
    });
  } catch (error) {
    console.error('Distribute weekly coupons error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to distribute weekly coupons' }
    });
  }
};
