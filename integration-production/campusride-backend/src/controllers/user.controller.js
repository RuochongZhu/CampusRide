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
    const { firstName, lastName, major, bio, phone, avatar_url } = req.body;

    // 构建更新数据
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (major) updateData.major = major;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, student_id, email, first_name, last_name, university, major, phone, role, points, created_at, avatar_url')
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
