import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';

// 获取当前用户资料
export const getProfile = async (req, res, next) => {
  try {
    // Guest users do not exist in the database; return token-derived profile
    if (req.user?.isGuest) {
      return res.json({
        success: true,
        data: { user: req.user }
      });
    }

    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      // Keep this list aligned with the actual schema (last_login_at does not exist in Supabase)
      .select('id, student_id, email, first_name, last_name, university, major, role, points, created_at, avatar_url')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户资料
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, major, bio, avatar_url } = req.body;

    // 构建更新数据
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (major) updateData.major = major;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, student_id, email, first_name, last_name, university, major, role, points, created_at, avatar_url')
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 根据ID获取用户信息 (供其他模块使用)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, student_id, first_name, last_name, university, major, points, created_at')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 批量获取用户信息 (供排行榜等模块使用)
export const batchGetUsers = async (req, res, next) => {
  try {
    const { userIds, limit = 50 } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      throw new AppError('User IDs array is required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (userIds.length > limit) {
      throw new AppError(`Cannot fetch more than ${limit} users at once`, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, student_id, first_name, last_name, university, major, points, created_at')
      .in('id', userIds)
      .eq('is_active', true);

    if (error) {
      throw new AppError('Failed to fetch users', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除当前用户账户
export const deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Guest users cannot delete account
    if (req.user?.isGuest) {
      throw new AppError('Guest users cannot delete account', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // Delete user's related data in order (to avoid foreign key constraints)
    // 1. Delete ride bookings
    await supabaseAdmin.from('ride_bookings').delete().eq('passenger_id', userId);

    // 2. Delete rides
    await supabaseAdmin.from('rides').delete().eq('driver_id', userId);

    // 3. Delete marketplace favorites
    await supabaseAdmin.from('item_favorites').delete().eq('user_id', userId);

    // 4. Delete marketplace items
    await supabaseAdmin.from('marketplace_items').delete().eq('seller_id', userId);

    // 5. Delete activity participants
    await supabaseAdmin.from('activity_participants').delete().eq('user_id', userId);

    // 6. Delete activities
    await supabaseAdmin.from('activities').delete().eq('organizer_id', userId);

    // 7. Delete point transactions
    await supabaseAdmin.from('point_transactions').delete().eq('user_id', userId);

    // 8. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

    // 9. Delete messages
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId);
    await supabaseAdmin.from('messages').delete().eq('receiver_id', userId);

    // 10. Delete user coupons
    await supabaseAdmin.from('user_coupons').delete().eq('user_id', userId);

    // 11. Finally delete the user
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw new AppError('Failed to delete account', 500, ERROR_CODES.DATABASE_ERROR, deleteError);
    }

    res.json({
      success: true,
      message: 'Your account has been permanently deleted'
    });
  } catch (error) {
    next(error);
  }
}; 
