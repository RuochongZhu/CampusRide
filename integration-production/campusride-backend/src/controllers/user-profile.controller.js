// user-profile.controller.js
// Complete user profile system with history, ratings, and coupons

import { supabaseAdmin } from '../config/database.js';

// Temporary logger fallback
const logger = console;

// ================================================
// 获取用户完整资料
// ================================================
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID is required'
        }
      });
    }

    // 获取用户基本信息
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, avatar_url, university, role, points, avg_rating, total_ratings')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // 统计真实的参与数据
    // 1. 统计打车次数 (作为司机发布的 + 作为乘客预订的)
    const { count: ridesAsDriver } = await supabaseAdmin
      .from('rides')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', userId);

    const { count: ridesAsPassenger } = await supabaseAdmin
      .from('ride_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('passenger_id', userId)
      .in('status', ['confirmed', 'completed']);

    // 2. 统计二手物品发布次数
    const { count: marketplacePosts } = await supabaseAdmin
      .from('marketplace_items')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', userId);

    // 3. 统计活动参与次数
    const { count: activitiesJoined } = await supabaseAdmin
      .from('activity_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 4. 统计自己创建的活动
    const { count: activitiesCreated } = await supabaseAdmin
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', userId);

    // 合并统计数据
    const totalRides = (ridesAsDriver || 0) + (ridesAsPassenger || 0);
    const totalMarketplace = marketplacePosts || 0;
    const totalActivities = (activitiesJoined || 0) + (activitiesCreated || 0);

    // 获取最近的评分（最多5条）
    const { data: recentRatings } = await supabaseAdmin
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        role_of_rater,
        created_at,
        rater:rater_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('ratee_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 获取用户的优惠券
    const { data: coupons } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 分类优惠券
    const now = new Date();
    const couponCategories = {
      active: coupons?.filter(c => !c.is_used && new Date(c.valid_until) > now) || [],
      used: coupons?.filter(c => c.is_used) || [],
      expired: coupons?.filter(c => !c.is_used && new Date(c.valid_until) <= now) || []
    };

    // 构建响应数据
    const response = {
      ...userData,
      total_rides_as_driver: ridesAsDriver || 0,
      total_rides_as_passenger: ridesAsPassenger || 0,
      total_carpools: totalRides,
      total_marketplace_posts: totalMarketplace,
      total_activities: totalActivities,
      ratings: {
        recent: recentRatings || [],
        summary: {
          average: userData.avg_rating,
          total: userData.total_ratings || 0
        }
      },
      statistics: {
        carpools: totalRides,
        activities: totalActivities,
        sales: totalMarketplace,
        points: userData.points || 0
      },
      coupons: {
        ...couponCategories,
        summary: {
          active: couponCategories.active.length,
          used: couponCategories.used.length,
          expired: couponCategories.expired.length,
          total: coupons?.length || 0
        }
      }
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile'
      }
    });
  }
};

// ================================================
// 获取用户历史记录
// ================================================
export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all', page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let histories = [];

    // 根据类型获取不同的历史记录
    if (type === 'all' || type === 'carpools') {
      // 获取拼车历史
      const { data: carpoolHistory } = await supabaseAdmin
        .from('ride_bookings')
        .select(`
          id,
          status,
          seats_booked,
          created_at,
          ride:ride_id (
            id,
            title,
            departure_time,
            arrival_time,
            origin,
            destination,
            driver:driver_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      histories = histories.concat(
        (carpoolHistory || []).map(booking => ({
          id: booking.id,
          type: 'carpool',
          title: booking.ride?.title || 'Unnamed Trip',
          status: booking.status,
          date: booking.ride?.departure_time || booking.created_at,
          details: {
            origin: booking.ride?.origin,
            destination: booking.ride?.destination,
            seats: booking.seats_booked,
            driver: booking.ride?.driver
          },
          created_at: booking.created_at
        }))
      );
    }

    if (type === 'all' || type === 'activities') {
      // 获取活动历史 - 这里需要根据实际的活动表结构调整
      // 假设有 activity_participants 表
      const { data: activityHistory } = await supabaseAdmin
        .from('activity_participants') // 需要创建此表
        .select(`
          id,
          status,
          created_at,
          activity:activity_id (
            id,
            title,
            start_time,
            end_time,
            location,
            organizer:organizer_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('participant_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      histories = histories.concat(
        (activityHistory || []).map(participation => ({
          id: participation.id,
          type: 'activity',
          title: participation.activity?.title || 'Activity',
          status: participation.status,
          date: participation.activity?.start_time || participation.created_at,
          details: {
            location: participation.activity?.location,
            duration: participation.activity?.end_time ?
              new Date(participation.activity.end_time) - new Date(participation.activity.start_time) : null,
            organizer: participation.activity?.organizer
          },
          created_at: participation.created_at
        }))
      );
    }

    if (type === 'all' || type === 'marketplace') {
      // 获取交易历史 - 买家视角
      const { data: purchaseHistory } = await supabaseAdmin
        .from('marketplace_transactions') // 需要创建此表
        .select(`
          id,
          status,
          amount,
          created_at,
          item:item_id (
            id,
            title,
            price,
            seller:seller_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      histories = histories.concat(
        (purchaseHistory || []).map(transaction => ({
          id: transaction.id,
          type: 'purchase',
          title: `Purchased: ${transaction.item?.title}`,
          status: transaction.status,
          date: transaction.created_at,
          details: {
            amount: transaction.amount,
            seller: transaction.item?.seller
          },
          created_at: transaction.created_at
        }))
      );
    }

    // 按时间排序
    histories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: {
        history: histories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: histories.length
        }
      }
    });

  } catch (error) {
    logger.error('Get user history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user history'
      }
    });
  }
};

// ================================================
// 更新用户资料
// ================================================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { first_name, last_name, avatar_url, university } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // 构建更新对象
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (university !== undefined) updateData.university = university;

    // 更新用户信息
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, first_name, last_name, email, avatar_url, university, is_online')
      .single();

    if (error) {
      logger.error('Update user profile error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update profile'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: updatedUser
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user profile'
      }
    });
  }
};

// ================================================
// 上传用户头像
// ================================================
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { image } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image data is required'
        }
      });
    }

    // Validate image format (base64)
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid image format. Please provide a valid image.'
        }
      });
    }

    // Extract image type and data
    const matches = image.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid image format'
        }
      });
    }

    const imageType = matches[1];
    const base64Data = matches[2];

    // Validate image type
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported image type. Allowed types: JPEG, PNG, WebP'
        }
      });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image size must be less than 5MB'
        }
      });
    }

    // Generate unique filename
    const fileExtension = imageType.toLowerCase() === 'jpeg' ? 'jpg' : imageType.toLowerCase();
    const filename = `avatars/${userId}_${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const bucketName = 'avatars';

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880
      });

      if (createError && createError.message !== 'Bucket already exists') {
        logger.error('Failed to create bucket:', createError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Failed to initialize storage'
          }
        });
      }
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: `image/${imageType}`,
        upsert: false
      });

    if (uploadError) {
      logger.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload image'
        }
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filename);

    if (!urlData?.publicUrl) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to generate public URL'
        }
      });
    }

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select('id, first_name, last_name, email, avatar_url, university')
      .single();

    if (updateError) {
      logger.error('Update user profile error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update profile'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        avatarUrl: avatarUrl
      },
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload avatar'
      }
    });
  }
};

// ================================================
// 获取用户积分历史
// ================================================
export const getUserPointsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取积分历史 - 使用 point_transactions 表
    const { data: pointsHistory, error } = await supabaseAdmin
      .from('point_transactions')
      .select('id, points, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      logger.error('Failed to fetch points history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch points history'
        }
      });
    }

    // 获取用户当前积分
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      data: {
        current_points: currentUser?.points || 0,
        history: pointsHistory || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: pointsHistory?.length || 0
        }
      }
    });

  } catch (error) {
    logger.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch points history'
      }
    });
  }
};

// ================================================
// 获取用户的优惠券
// ================================================
export const getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'all' } = req.query; // active, used, expired, all

    let query = supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 根据状态筛选
    const now = new Date().toISOString();
    if (status === 'active') {
      query = query.eq('is_used', false).gt('valid_until', now);
    } else if (status === 'used') {
      query = query.eq('is_used', true);
    } else if (status === 'expired') {
      query = query.eq('is_used', false).lt('valid_until', now);
    }

    const { data: coupons, error } = await query;

    if (error) {
      logger.error('Failed to fetch user coupons:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch coupons'
        }
      });
    }

    // 计算统计信息
    const allCoupons = status === 'all' ? coupons :
      await supabaseAdmin.from('coupons').select('*').eq('user_id', userId);

    const stats = {
      total: allCoupons.data?.length || 0,
      active: 0,
      used: 0,
      expired: 0
    };

    if (allCoupons.data) {
      allCoupons.data.forEach(coupon => {
        if (coupon.is_used) {
          stats.used++;
        } else if (new Date(coupon.valid_until) > new Date()) {
          stats.active++;
        } else {
          stats.expired++;
        }
      });
    }

    res.json({
      success: true,
      data: {
        coupons: coupons || [],
        statistics: stats
      }
    });

  } catch (error) {
    logger.error('Get user coupons error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user coupons'
      }
    });
  }
};

// ================================================
// 使用优惠券
// ================================================
export const useCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // 检查优惠券是否存在且属于该用户
    const { data: coupon, error: fetchError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Coupon not found'
        }
      });
    }

    // 检查优惠券是否已使用
    if (coupon.is_used) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_ALREADY_USED',
          message: 'This coupon has already been used'
        }
      });
    }

    // 检查优惠券是否过期
    if (new Date(coupon.valid_until) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_EXPIRED',
          message: 'This coupon has expired'
        }
      });
    }

    // 标记优惠券为已使用
    const { data: updatedCoupon, error: updateError } = await supabaseAdmin
      .from('coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', couponId)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Failed to update coupon:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to use coupon'
        }
      });
    }

    res.json({
      success: true,
      data: {
        coupon: updatedCoupon
      },
      message: 'Coupon used successfully'
    });

  } catch (error) {
    logger.error('Use coupon error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to use coupon'
      }
    });
  }
};

// ================================================
// Toggle hide rank setting
// ================================================
export const toggleHideRank = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { hide_rank } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (typeof hide_rank !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'hide_rank must be a boolean value'
        }
      });
    }

    // Update user's hide_rank setting
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({ hide_rank })
      .eq('id', userId)
      .select('id, first_name, last_name, hide_rank')
      .single();

    if (error) {
      logger.error('Toggle hide rank error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update privacy setting'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: updatedUser
      },
      message: hide_rank
        ? 'Your rank is now hidden from the leaderboard'
        : 'Your rank is now visible on the leaderboard'
    });

  } catch (error) {
    logger.error('Toggle hide rank error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update privacy setting'
      }
    });
  }
};

// ================================================
// Get hide rank status
// ================================================
export const getHideRankStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('hide_rank')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch privacy setting'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hide_rank: user?.hide_rank || false
      }
    });

  } catch (error) {
    logger.error('Get hide rank status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch privacy setting'
      }
    });
  }
};

export default {
  getUserProfile,
  getUserHistory,
  updateUserProfile,
  getUserPointsHistory,
  getUserCoupons,
  useCoupon,
  toggleHideRank,
  getHideRankStatus
};
