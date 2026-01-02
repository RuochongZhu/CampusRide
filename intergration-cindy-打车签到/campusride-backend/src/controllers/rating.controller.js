import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';

/**
 * 创建评分
 * 司机和乘客在完成行程后互相评分
 */
export const createRating = async (req, res, next) => {
  try {
    const raterId = req.user.id;
    const { tripId, rateeId, score, comment, roleOfRater } = req.body;

    // 验证必填字段
    if (!tripId || !rateeId || !score || !roleOfRater) {
      throw new AppError(
        'Missing required fields: tripId, rateeId, score, roleOfRater',
        400,
        ERROR_CODES.REQUIRED_FIELD_MISSING
      );
    }

    // 验证评分范围
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      throw new AppError(
        'Score must be an integer between 1 and 5',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 验证角色
    if (!['driver', 'passenger'].includes(roleOfRater)) {
      throw new AppError(
        'roleOfRater must be either "driver" or "passenger"',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 不能给自己评分
    if (raterId === rateeId) {
      throw new AppError(
        'You cannot rate yourself',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 验证行程是否存在且已完成
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new AppError('Trip not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (trip.status !== 'completed') {
      throw new AppError(
        'Can only rate completed trips',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 验证评价人是否参与了这个行程
    let isParticipant = false;

    if (roleOfRater === 'driver') {
      // 如果评价人是司机，检查是否是该行程的司机
      isParticipant = trip.driver_id === raterId;
    } else {
      // 如果评价人是乘客，检查是否预订了该行程
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', raterId)
        .eq('status', 'completed')
        .single();
      
      isParticipant = !!booking;
    }

    if (!isParticipant) {
      throw new AppError(
        'You must be a participant of this trip to rate',
        403,
        ERROR_CODES.ACCESS_DENIED
      );
    }

    // 验证被评价人是否参与了这个行程
    let isRateeParticipant = false;

    if (roleOfRater === 'driver') {
      // 司机评价乘客，检查被评价人是否是该行程的乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', rateeId)
        .eq('status', 'completed')
        .single();
      
      isRateeParticipant = !!booking;
    } else {
      // 乘客评价司机，检查被评价人是否是该行程的司机
      isRateeParticipant = trip.driver_id === rateeId;
    }

    if (!isRateeParticipant) {
      throw new AppError(
        'The person you are rating was not a participant of this trip',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 创建评分（如果已存在则更新）
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('trip_id', tripId)
      .eq('rater_id', raterId)
      .eq('ratee_id', rateeId)
      .single();

    let rating;
    if (existingRating) {
      // 更新现有评分
      const { data, error } = await supabaseAdmin
        .from('ratings')
        .update({
          score,
          comment: comment || null,
          role_of_rater: roleOfRater,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select('*')
        .single();

      if (error) {
        throw new AppError(
          'Failed to update rating',
          500,
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }
      rating = data;
    } else {
      // 创建新评分
      const { data, error } = await supabaseAdmin
        .from('ratings')
        .insert({
          trip_id: tripId,
          rater_id: raterId,
          ratee_id: rateeId,
          score,
          comment: comment || null,
          role_of_rater: roleOfRater
        })
        .select('*')
        .single();

      if (error) {
        throw new AppError(
          'Failed to create rating',
          500,
          ERROR_CODES.DATABASE_ERROR,
          error
        );
      }
      rating = data;
    }

    res.status(201).json({
      success: true,
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully',
      data: { rating }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户的平均评分
 */
export const getUserRating = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 获取用户信息（包含缓存的平均评分）
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, avg_rating, total_ratings')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 实时计算平均评分（作为验证）
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('ratee_id', userId);

    if (ratingsError) {
      throw new AppError(
        'Failed to fetch ratings',
        500,
        ERROR_CODES.DATABASE_ERROR,
        ratingsError
      );
    }

    let calculatedAvgRating = null;
    let totalRatings = 0;

    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.score, 0);
      calculatedAvgRating = Math.round((sum / ratings.length) * 100) / 100; // 四舍五入到2位小数
      totalRatings = ratings.length;
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avgRating: calculatedAvgRating,
        totalRatings: totalRatings,
        // 同时返回缓存的评分用于对比
        cachedAvgRating: user.avg_rating ? parseFloat(user.avg_rating) : null,
        cachedTotalRatings: user.total_ratings || 0,
        // 判断用户是否是新用户（没有评分）
        isNew: totalRatings === 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取行程的所有评分
 */
export const getTripRatings = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      throw new AppError('Trip ID is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 获取该行程的所有评分
    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        role_of_rater,
        created_at,
        rater:users!ratings_rater_id_fkey(id, first_name, last_name, avatar_url),
        ratee:users!ratings_ratee_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(
        'Failed to fetch trip ratings',
        500,
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }

    res.json({
      success: true,
      data: {
        tripId,
        ratings: ratings || [],
        totalRatings: ratings?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户收到的所有评分（带分页）
 */
export const getUserReceivedRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError('User ID is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    const offset = (page - 1) * limit;

    // 获取总数
    const { count, error: countError } = await supabaseAdmin
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('ratee_id', userId);

    if (countError) {
      throw new AppError(
        'Failed to count ratings',
        500,
        ERROR_CODES.DATABASE_ERROR,
        countError
      );
    }

    // 获取评分列表
    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        role_of_rater,
        created_at,
        trip:rides(id, title, departure_time),
        rater:users!ratings_rater_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('ratee_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(
        'Failed to fetch ratings',
        500,
        ERROR_CODES.DATABASE_ERROR,
        error
      );
    }

    res.json({
      success: true,
      data: {
        ratings: ratings || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 检查用户是否可以评价某个行程的某个人
 */
export const canRateUser = async (req, res, next) => {
  try {
    const raterId = req.user.id;
    const { tripId, rateeId } = req.query;

    if (!tripId || !rateeId) {
      throw new AppError(
        'Trip ID and Ratee ID are required',
        400,
        ERROR_CODES.REQUIRED_FIELD_MISSING
      );
    }

    // 检查行程是否已完成
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.json({
        success: true,
        data: { canRate: false, reason: 'Trip not found' }
      });
    }

    if (trip.status !== 'completed') {
      return res.json({
        success: true,
        data: { canRate: false, reason: 'Trip not completed yet' }
      });
    }

    // 检查是否已经评价过
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('trip_id', tripId)
      .eq('rater_id', raterId)
      .eq('ratee_id', rateeId)
      .single();

    if (existingRating) {
      return res.json({
        success: true,
        data: { canRate: false, reason: 'Already rated', ratingId: existingRating.id }
      });
    }

    // 检查评价人和被评价人的关系
    const isDriver = trip.driver_id === raterId;
    const isRateeDriver = trip.driver_id === rateeId;

    if (isDriver && isRateeDriver) {
      return res.json({
        success: true,
        data: { canRate: false, reason: 'Cannot rate yourself' }
      });
    }

    if (isDriver) {
      // 司机评价乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', rateeId)
        .eq('status', 'completed')
        .single();

      if (!booking) {
        return res.json({
          success: true,
          data: { canRate: false, reason: 'Ratee was not a passenger on this trip' }
        });
      }

      return res.json({
        success: true,
        data: { canRate: true, roleOfRater: 'driver' }
      });
    } else {
      // 乘客评价司机
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', raterId)
        .eq('status', 'completed')
        .single();

      if (!booking) {
        return res.json({
          success: true,
          data: { canRate: false, reason: 'You were not a passenger on this trip' }
        });
      }

      if (!isRateeDriver) {
        return res.json({
          success: true,
          data: { canRate: false, reason: 'Ratee was not the driver' }
        });
      }

      return res.json({
        success: true,
        data: { canRate: true, roleOfRater: 'passenger' }
      });
    }
  } catch (error) {
    next(error);
  }
};
