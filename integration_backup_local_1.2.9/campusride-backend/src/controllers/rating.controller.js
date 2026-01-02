// rating.controller.js
// Rating system implementation based on Cindy's design

import { supabaseAdmin } from '../config/database.js';
// import { logger } from '../utils/logger.js'; // Temporarily disabled

// ================================================
// 创建或更新评分
// ================================================
export const createRating = async (req, res) => {
  try {
    const { tripId, rateeId, score, comment, roleOfRater } = req.body;
    const raterId = req.user?.id;

    // 验证参数
    if (!tripId || !rateeId || !score || !roleOfRater) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: tripId, rateeId, score, roleOfRater'
        }
      });
    }

    // 验证评分范围
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Score must be an integer between 1 and 5'
        }
      });
    }

    // 验证角色
    if (!['driver', 'passenger'].includes(roleOfRater)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'roleOfRater must be either "driver" or "passenger"'
        }
      });
    }

    // 验证不能给自己评分
    if (raterId === rateeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot rate yourself'
        }
      });
    }

    // 检查行程是否存在
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // 检查行程是否已完成
    if (trip.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRIP_STATUS',
          message: 'Can only rate completed trips'
        }
      });
    }

    // 验证用户是否是该行程的参与者
    let isParticipant = false;

    // 检查是否是司机
    if (trip.driver_id === raterId) {
      isParticipant = true;
      // 如果用户是司机，只能评价乘客
      if (roleOfRater !== 'driver') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Trip driver must have role "driver" when rating passengers'
          }
        });
      }

      // 检查被评价人是否是该行程的乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', rateeId)
        .single();

      if (!booking) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'The person you are rating was not a passenger on this trip'
          }
        });
      }
    } else {
      // 检查是否是乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', raterId)
        .single();

      if (booking) {
        isParticipant = true;
        // 如果用户是乘客，只能评价司机
        if (roleOfRater !== 'passenger') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Trip passenger must have role "passenger" when rating driver'
            }
          });
        }

        // 检查被评价人是否是该行程的司机
        if (trip.driver_id !== rateeId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'Passengers can only rate the trip driver'
            }
          });
        }
      }
    }

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You must be a participant of this trip to rate'
        }
      });
    }

    // 检查是否已经评价过（用于更新）
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('trip_id', tripId)
      .eq('rater_id', raterId)
      .eq('ratee_id', rateeId)
      .single();

    const ratingData = {
      trip_id: tripId,
      rater_id: raterId,
      ratee_id: rateeId,
      role_of_rater: roleOfRater,
      score: score,
      comment: comment?.trim() || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingRating) {
      // 更新现有评分
      const { data: updatedRating, error } = await supabaseAdmin
        .from('ratings')
        .update(ratingData)
        .eq('id', existingRating.id)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update rating:', error);
        throw error;
      }
      result = updatedRating;
    } else {
      // 创建新评分
      ratingData.created_at = new Date().toISOString();
      const { data: newRating, error } = await supabaseAdmin
        .from('ratings')
        .insert(ratingData)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to create rating:', error);
        throw error;
      }
      result = newRating;
    }

    res.json({
      success: true,
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully',
      data: {
        rating: result
      }
    });

  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit rating'
      }
    });
  }
};

// ================================================
// 获取用户评分信息
// ================================================
export const getUserRating = async (req, res) => {
  try {
    const { userId } = req.params;

    // 获取用户基本信息和缓存的评分
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, avg_rating, total_ratings')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // 实时计算评分（确保数据一致性）
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .eq('ratee_id', userId);

    if (ratingsError) {
      console.error('Failed to fetch ratings:', ratingsError);
      // 如果查询失败，使用缓存数据
      const response = {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avgRating: user.avg_rating,
        totalRatings: user.total_ratings || 0,
        cachedAvgRating: user.avg_rating,
        cachedTotalRatings: user.total_ratings || 0,
        isNew: !user.avg_rating
      };

      return res.json({
        success: true,
        data: response
      });
    }

    // 计算实时统计
    const totalRatings = ratings?.length || 0;
    let avgRating = null;

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
      avgRating = Math.round((sum / totalRatings) * 100) / 100; // 四舍五入到2位小数
    }

    const response = {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      avgRating: avgRating,
      totalRatings: totalRatings,
      cachedAvgRating: user.avg_rating,
      cachedTotalRatings: user.total_ratings || 0,
      isNew: totalRatings === 0
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user rating'
      }
    });
  }
};

// ================================================
// 获取行程的所有评分
// ================================================
export const getTripRatings = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { data: ratings, error } = await supabaseAdmin
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
        ),
        ratee:ratee_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch trip ratings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch trip ratings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        tripId: tripId,
        ratings: ratings || []
      }
    });

  } catch (error) {
    console.error('Get trip ratings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trip ratings'
      }
    });
  }
};

// ================================================
// 获取用户收到的评分
// ================================================
export const getUserReceivedRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: ratings, error, count } = await supabaseAdmin
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
        ),
        trip:trip_id (
          id,
          title,
          departure_time
        )
      `, { count: 'exact' })
      .eq('ratee_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Failed to fetch received ratings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch received ratings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        ratings: ratings || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0
        }
      }
    });

  } catch (error) {
    console.error('Get received ratings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch received ratings'
      }
    });
  }
};

// ================================================
// 检查是否可以评价
// ================================================
export const canRate = async (req, res) => {
  try {
    const { tripId, rateeId } = req.query;
    const raterId = req.user?.id;

    if (!tripId || !rateeId || !raterId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required parameters: tripId, rateeId'
        }
      });
    }

    // 检查行程是否存在且已完成
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('rides')
      .select('id, driver_id, status')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.json({
        success: true,
        data: {
          canRate: false,
          reason: 'Trip not found'
        }
      });
    }

    if (trip.status !== 'completed') {
      return res.json({
        success: true,
        data: {
          canRate: false,
          reason: 'Trip not completed yet'
        }
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
        data: {
          canRate: false,
          reason: 'Already rated',
          ratingId: existingRating.id
        }
      });
    }

    // 确定评价者角色
    let roleOfRater = null;

    if (trip.driver_id === raterId) {
      roleOfRater = 'driver';
      // 检查被评价人是否是乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', rateeId)
        .single();

      if (!booking) {
        return res.json({
          success: true,
          data: {
            canRate: false,
            reason: 'Person is not a passenger on this trip'
          }
        });
      }
    } else {
      // 检查评价者是否是乘客
      const { data: booking } = await supabaseAdmin
        .from('ride_bookings')
        .select('id')
        .eq('ride_id', tripId)
        .eq('passenger_id', raterId)
        .single();

      if (booking) {
        roleOfRater = 'passenger';
        // 检查被评价人是否是司机
        if (trip.driver_id !== rateeId) {
          return res.json({
            success: true,
            data: {
              canRate: false,
              reason: 'Can only rate the trip driver'
            }
          });
        }
      } else {
        return res.json({
          success: true,
          data: {
            canRate: false,
            reason: 'You are not a participant of this trip'
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        canRate: true,
        roleOfRater: roleOfRater
      }
    });

  } catch (error) {
    console.error('Can rate check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check rating eligibility'
      }
    });
  }
};

// ================================================
// Create Activity Rating (after activity completion)
// ================================================
export const createActivityRating = async (req, res) => {
  try {
    const { activityId, rateeId, score, comment, roleOfRater } = req.body;
    const raterId = req.user?.id;

    // Validate parameters
    if (!activityId || !rateeId || !score || !roleOfRater) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: activityId, rateeId, score, roleOfRater'
        }
      });
    }

    // Validate score range
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Score must be an integer between 1 and 5'
        }
      });
    }

    // Validate role
    if (!['organizer', 'participant'].includes(roleOfRater)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'roleOfRater must be either "organizer" or "participant"'
        }
      });
    }

    // Cannot rate yourself
    if (raterId === rateeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot rate yourself'
        }
      });
    }

    // Check if activity exists and is completed
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id, status')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Activity not found'
        }
      });
    }

    // Check if activity is completed
    if (activity.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTIVITY_STATUS',
          message: 'Can only rate completed activities'
        }
      });
    }

    // Verify user is a participant
    let isParticipant = false;

    if (activity.organizer_id === raterId) {
      isParticipant = true;
      if (roleOfRater !== 'organizer') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Activity organizer must have role "organizer" when rating participants'
          }
        });
      }

      // Check if ratee is a participant
      const { data: participation } = await supabaseAdmin
        .from('activity_participations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', rateeId)
        .single();

      if (!participation) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'The person you are rating was not a participant of this activity'
          }
        });
      }
    } else {
      // Check if user is a participant
      const { data: participation } = await supabaseAdmin
        .from('activity_participations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', raterId)
        .single();

      if (participation) {
        isParticipant = true;
        if (roleOfRater !== 'participant') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Activity participant must have role "participant" when rating'
            }
          });
        }

        // Participants can rate the organizer
        if (rateeId !== activity.organizer_id) {
          // Or other participants
          const { data: rateeParticipation } = await supabaseAdmin
            .from('activity_participations')
            .select('id')
            .eq('activity_id', activityId)
            .eq('user_id', rateeId)
            .single();

          if (!rateeParticipation) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'ACCESS_DENIED',
                message: 'Can only rate the organizer or other participants of this activity'
              }
            });
          }
        }
      }
    }

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You must be a participant of this activity to rate'
        }
      });
    }

    // Check if already rated
    const { data: existingRating } = await supabaseAdmin
      .from('activity_ratings')
      .select('id')
      .eq('activity_id', activityId)
      .eq('rater_id', raterId)
      .eq('ratee_id', rateeId)
      .single();

    const ratingData = {
      activity_id: activityId,
      rater_id: raterId,
      ratee_id: rateeId,
      role_of_rater: roleOfRater,
      score: score,
      comment: comment?.trim() || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingRating) {
      // Update existing rating
      const { data: updatedRating, error } = await supabaseAdmin
        .from('activity_ratings')
        .update(ratingData)
        .eq('id', existingRating.id)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update activity rating:', error);
        throw error;
      }
      result = updatedRating;
    } else {
      // Create new rating
      ratingData.created_at = new Date().toISOString();
      const { data: newRating, error } = await supabaseAdmin
        .from('activity_ratings')
        .insert(ratingData)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to create activity rating:', error);
        throw error;
      }
      result = newRating;
    }

    // Update user average rating
    await updateUserAverageRating(rateeId);

    res.json({
      success: true,
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully',
      data: {
        rating: result
      }
    });

  } catch (error) {
    console.error('Create activity rating error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit rating'
      }
    });
  }
};

// ================================================
// Get Activity Ratings
// ================================================
export const getActivityRatings = async (req, res) => {
  try {
    const { activityId } = req.params;

    const { data: ratings, error } = await supabaseAdmin
      .from('activity_ratings')
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
        ),
        ratee:ratee_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch activity ratings:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch activity ratings'
        }
      });
    }

    res.json({
      success: true,
      data: {
        activityId: activityId,
        ratings: ratings || []
      }
    });

  } catch (error) {
    console.error('Get activity ratings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch activity ratings'
      }
    });
  }
};

// ================================================
// Check if can rate activity
// ================================================
export const canRateActivity = async (req, res) => {
  try {
    const { activityId, rateeId } = req.query;
    const raterId = req.user?.id;

    if (!activityId || !rateeId || !raterId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required parameters: activityId, rateeId'
        }
      });
    }

    // Check if activity exists and is completed
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .select('id, organizer_id, status')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return res.json({
        success: true,
        data: {
          canRate: false,
          reason: 'Activity not found'
        }
      });
    }

    if (activity.status !== 'completed') {
      return res.json({
        success: true,
        data: {
          canRate: false,
          reason: 'Activity not completed yet'
        }
      });
    }

    // Check if already rated
    const { data: existingRating } = await supabaseAdmin
      .from('activity_ratings')
      .select('id')
      .eq('activity_id', activityId)
      .eq('rater_id', raterId)
      .eq('ratee_id', rateeId)
      .single();

    if (existingRating) {
      return res.json({
        success: true,
        data: {
          canRate: false,
          reason: 'Already rated',
          ratingId: existingRating.id
        }
      });
    }

    // Determine rater role
    let roleOfRater = null;

    if (activity.organizer_id === raterId) {
      roleOfRater = 'organizer';
    } else {
      const { data: participation } = await supabaseAdmin
        .from('activity_participations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', raterId)
        .single();

      if (participation) {
        roleOfRater = 'participant';
      } else {
        return res.json({
          success: true,
          data: {
            canRate: false,
            reason: 'You are not a participant of this activity'
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        canRate: true,
        roleOfRater: roleOfRater
      }
    });

  } catch (error) {
    console.error('Can rate activity check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check rating eligibility'
      }
    });
  }
};

// ================================================
// Helper: Update user average rating
// ================================================
const updateUserAverageRating = async (userId) => {
  try {
    // Get all ratings for this user (both trip and activity ratings)
    const [tripRatings, activityRatings] = await Promise.all([
      supabaseAdmin
        .from('ratings')
        .select('score')
        .eq('ratee_id', userId),
      supabaseAdmin
        .from('activity_ratings')
        .select('score')
        .eq('ratee_id', userId)
    ]);

    const allRatings = [
      ...(tripRatings.data || []),
      ...(activityRatings.data || [])
    ];

    if (allRatings.length === 0) return;

    const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await supabaseAdmin
      .from('users')
      .update({
        avg_rating: Math.round(avgRating * 100) / 100,
        total_ratings: allRatings.length
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Failed to update user average rating:', error);
  }
};

export default {
  createRating,
  getUserRating,
  getTripRatings,
  getUserReceivedRatings,
  canRate,
  createActivityRating,
  getActivityRatings,
  canRateActivity
};