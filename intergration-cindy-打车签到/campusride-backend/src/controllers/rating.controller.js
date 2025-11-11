import { supabaseAdmin } from '../config/database.js';

/**
 * 创建评分
 * POST /api/ratings
 * Body: { tripId, rateeId, score: 1-5, comment? }
 */
export const createRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, rateeId, score, comment } = req.body;

    // 验证必填字段
    if (!tripId || !rateeId || !score) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: tripId, rateeId, score'
        }
      });
    }

    // 验证评分范围
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SCORE',
          message: 'Score must be an integer between 1 and 5'
        }
      });
    }

    // 不能给自己评分
    if (rateeId === userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_RATE_SELF',
          message: 'You cannot rate yourself'
        }
      });
    }

    // 获取行程信息
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id, departure_time, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // 检查行程是否已开始
    const now = new Date();
    const departureTime = new Date(trip.departure_time);
    if (now < departureTime) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'TRIP_NOT_STARTED',
          message: 'Cannot rate before the trip has started'
        }
      });
    }

    // 确认用户是司机还是乘客
    const isDriver = trip.driver_id === userId;
    let isPassenger = false;
    let roleOfRater = null;

    if (isDriver) {
      roleOfRater = 'driver';
      // 验证 rateeId 是这个行程的乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', rateeId)
        .eq('status', 'confirmed')
        .single();

      if (!booking) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_RATEE',
            message: 'You can only rate passengers who confirmed their booking on this trip'
          }
        });
      }
    } else {
      // 检查是否是乘客
      const { data: myBooking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id, status')
        .eq('ride_id', tripId)
        .eq('passenger_id', userId)
        .single();

      if (!myBooking) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_PARTICIPANT',
            message: 'You must be a participant (driver or passenger) of this trip to rate'
          }
        });
      }

      if (myBooking.status !== 'confirmed' && myBooking.status !== 'completed') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'BOOKING_NOT_CONFIRMED',
            message: 'Your booking must be confirmed to rate this trip'
          }
        });
      }

      isPassenger = true;
      roleOfRater = 'passenger';

      // 乘客只能评价司机
      if (rateeId !== trip.driver_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_RATEE',
            message: 'As a passenger, you can only rate the driver'
          }
        });
      }
    }

    // 检查是否已经评价过
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('trip_id', tripId)
      .eq('rater_id', userId)
      .eq('ratee_id', rateeId)
      .single();

    if (existingRating) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_RATED',
          message: "You've already rated this person for this trip"
        }
      });
    }

    // 创建评分
    const { data: rating, error: ratingError } = await supabaseAdmin
      .from('ratings')
      .insert({
        trip_id: tripId,
        rater_id: userId,
        ratee_id: rateeId,
        role_of_rater: roleOfRater,
        score,
        comment: comment || null
      })
      .select('*')
      .single();

    if (ratingError) {
      console.error('Error creating rating:', ratingError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_RATING_FAILED',
          message: ratingError.message
        }
      });
    }

    // 创建通知（被评分者收到通知）
    await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'rating_received',
        trip_id: tripId,
        driver_id: isDriver ? userId : trip.driver_id,
        passenger_id: isPassenger ? userId : rateeId,
        booking_id: null,
        status: 'pending',
        message: `You received a ${score}-star rating`,
        is_read: false
      });

    res.status(201).json({
      success: true,
      data: { rating },
      message: 'Thanks for your rating'
    });

  } catch (error) {
    console.error('Error in createRating:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create rating'
      }
    });
  }
};

/**
 * 获取用户的评分状态（针对某个行程）
 * GET /api/ratings/my?tripId=xxx
 */
export const getMyRatingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.query;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TRIP_ID',
          message: 'tripId is required'
        }
      });
    }

    // 获取行程信息
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    const isDriver = trip.driver_id === userId;

    // 获取我给别人的评分
    const { data: myRatings } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('trip_id', tripId)
      .eq('rater_id', userId);

    // 获取别人给我的评分
    const { data: receivedRatings } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('trip_id', tripId)
      .eq('ratee_id', userId);

    res.json({
      success: true,
      data: {
        role: isDriver ? 'driver' : 'passenger',
        ratingsGiven: myRatings || [],
        ratingsReceived: receivedRatings || []
      }
    });

  } catch (error) {
    console.error('Error in getMyRatingStatus:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get rating status'
      }
    });
  }
};

/**
 * 获取用户的平均评分
 * GET /api/ratings/average/:userId
 */
export const getUserAverageRating = async (req, res) => {
  try {
    const { userId } = req.params;

    // 获取该用户收到的所有评分
    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('ratee_id', userId);

    if (error) {
      console.error('Error fetching ratings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_RATINGS_FAILED',
          message: error.message
        }
      });
    }

    const totalRatings = ratings?.length || 0;
    const averageScore = totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        averageScore: averageScore ? parseFloat(averageScore) : null,
        totalRatings
      }
    });

  } catch (error) {
    console.error('Error in getUserAverageRating:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get average rating'
      }
    });
  }
};

/**
 * 获取行程的所有评分
 * GET /api/ratings/trip/:tripId
 */
export const getTripRatings = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trip ratings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_RATINGS_FAILED',
          message: error.message
        }
      });
    }

    // 获取评分者和被评分者的信息
    const userIds = [...new Set(ratings?.flatMap(r => [r.rater_id, r.ratee_id]) || [])];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    const userMap = {};
    users?.forEach(u => {
      userMap[u.id] = u;
    });

    const enrichedRatings = ratings?.map(r => ({
      ...r,
      rater: userMap[r.rater_id],
      ratee: userMap[r.ratee_id]
    }));

    res.json({
      success: true,
      data: {
        ratings: enrichedRatings || []
      }
    });

  } catch (error) {
    console.error('Error in getTripRatings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trip ratings'
      }
    });
  }
};




