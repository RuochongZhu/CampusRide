import { supabaseAdmin } from '../config/database.js';

class ActivityCheckinService {

  // 格式化时间差
  formatTimeUntil(minutes) {
    if (minutes < 1) return '不到1分钟';
    if (minutes < 60) return `${minutes}分钟`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days < 7) {
      return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
    }

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    return remainingDays > 0 ? `${weeks}周${remainingDays}天` : `${weeks}周`;
  }

  // 检查用户是否可以签到
  async canUserCheckin(activityId, userId) {
    try {
      console.log('🔍 开始检查用户签到资格:', { activityId, userId });

      // 获取活动信息和用户参与状态
      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .select(`
          id,
          title,
          start_time,
          end_time,
          checkin_enabled,
          checkin_start_offset,
          checkin_end_offset,
          location_verification,
          verification_radius,
          location_coordinates,
          status
        `)
        .eq('id', activityId)
        .single();

      console.log('📊 活动查询结果:', {
        found: !!activity,
        error: !!activityError,
        activityId,
        activityData: activity ? { id: activity.id, title: activity.title, status: activity.status } : null,
        errorDetails: activityError
      });

      if (activityError || !activity) {
        console.error('❌ 活动查询失败:', { activityError, activityId });
        return {
          success: false,
          error: '活动不存在',
          canCheckin: false
        };
      }

      // 检查活动是否启用签到
      if (!activity.checkin_enabled) {
        return {
          success: true,
          canCheckin: false,
          reason: '此活动未启用签到功能',
          activity
        };
      }

      // 检查活动状态 - 允许 published, upcoming, ongoing 状态的活动签到
      if (activity.status !== 'ongoing' && activity.status !== 'upcoming' && activity.status !== 'published') {
        return {
          success: true,
          canCheckin: false,
          reason: '活动已结束或已取消',
          activity
        };
      }

      // 检查用户是否已注册参加活动
      console.log('🔍 查询用户参与记录:', { activityId, userId });
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('activity_participants')
        .select('id, checked_in, checkin_time')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      console.log('📊 参与记录查询结果:', {
        found: !!participation,
        errorExists: !!participationError,
        participationData: participation,
        errorDetails: participationError
      });

      if (participationError || !participation) {
        console.log('❌ 未找到参与记录，用户未注册此活动');
        return {
          success: true,
          canCheckin: false,
          reason: '您未注册参加此活动',
          activity
        };
      }

      // 检查用户是否已经签到
      if (participation.checked_in) {
        return {
          success: true,
          canCheckin: false,
          reason: '您已经签到过了',
          checkinTime: participation.checkin_time,
          activity
        };
      }

      // 检查是否在签到时间范围内
      const now = new Date();
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);
      const checkinStartOffset = activity.checkin_start_offset || 30;
      const checkinEndOffset = activity.checkin_end_offset || 30;

      const checkinStart = new Date(startTime.getTime() - checkinStartOffset * 60 * 1000);
      const checkinEnd = new Date(endTime.getTime() + checkinEndOffset * 60 * 1000);

      if (now < checkinStart) {
        const minutesUntilStart = Math.ceil((checkinStart - now) / (1000 * 60));
        const timeUntilStart = this.formatTimeUntil(minutesUntilStart);

        return {
          success: true,
          canCheckin: false,
          reason: `签到将在 ${timeUntilStart} 后开始（${checkinStart.toLocaleString('zh-CN')}）`,
          checkinPeriod: { start: checkinStart, end: checkinEnd },
          timeUntilStart: minutesUntilStart,
          activity
        };
      }

      if (now > checkinEnd) {
        const minutesSinceEnd = Math.floor((now - checkinEnd) / (1000 * 60));
        const timeSinceEnd = this.formatTimeUntil(minutesSinceEnd);

        return {
          success: true,
          canCheckin: false,
          reason: `签到已于 ${timeSinceEnd} 前结束（${checkinEnd.toLocaleString('zh-CN')}）`,
          checkinPeriod: { start: checkinStart, end: checkinEnd },
          timeSinceEnd: minutesSinceEnd,
          activity
        };
      }

      // 所有条件都满足，可以签到
      const minutesRemaining = Math.floor((checkinEnd - now) / (1000 * 60));
      const timeRemaining = this.formatTimeUntil(minutesRemaining);

      return {
        success: true,
        canCheckin: true,
        checkinPeriod: { start: checkinStart, end: checkinEnd },
        timeRemaining: minutesRemaining,
        timeRemainingText: timeRemaining,
        requiresLocation: activity.location_verification,
        verificationRadius: activity.verification_radius || 50,
        activityLocation: activity.location_coordinates,
        participationId: participation.id,
        activity
      };

    } catch (error) {
      console.error('❌ Check checkin eligibility failed:', error);
      return {
        success: false,
        error: error.message,
        canCheckin: false
      };
    }
  }

  // 执行签到
  async performCheckin(activityId, userId, checkinData) {
    try {
      const { userLocation, deviceInfo } = checkinData;

      // 首先检查用户是否可以签到
      const eligibilityCheck = await this.canUserCheckin(activityId, userId);
      if (!eligibilityCheck.success || !eligibilityCheck.canCheckin) {
        return {
          success: false,
          error: eligibilityCheck.reason || eligibilityCheck.error
        };
      }

      const { activity, participationId, requiresLocation, verificationRadius, activityLocation } = eligibilityCheck;

      let locationVerified = true;
      let distance = 0;

      // 如果需要位置验证
      if (requiresLocation && activityLocation && userLocation) {
        try {
          // 计算距离
          const { data: distanceResult, error: distanceError } = await supabaseAdmin
            .rpc('calculate_distance', {
              lat1: userLocation.latitude,
              lon1: userLocation.longitude,
              lat2: activityLocation.lat || activityLocation.latitude,
              lon2: activityLocation.lng || activityLocation.longitude
            });

          if (distanceError) {
            console.error('❌ Distance calculation error:', distanceError);
            distance = 999999; // 设置一个很大的距离
          } else {
            distance = distanceResult || 0;
          }

          locationVerified = distance <= verificationRadius;

          if (!locationVerified) {
            return {
              success: false,
              error: `您距离活动地点 ${Math.round(distance)}米，超出了 ${verificationRadius}米 的签到范围`,
              distance,
              requiredRadius: verificationRadius
            };
          }
        } catch (error) {
          console.error('❌ Location verification failed:', error);
          return {
            success: false,
            error: '位置验证失败，请重试'
          };
        }
      } else if (requiresLocation && !userLocation) {
        return {
          success: false,
          error: '此活动需要位置验证，请允许获取您的位置信息'
        };
      }

      const checkinTime = new Date();

      // 开始事务
      const { data: checkinRecord, error: checkinError } = await supabaseAdmin
        .from('activity_checkins')
        .insert({
          activity_id: activityId,
          user_id: userId,
          participation_id: participationId,
          checkin_time: checkinTime.toISOString(),
          user_location: userLocation || {},
          activity_location: activityLocation || {},
          distance_meters: distance,
          location_verified: locationVerified,
          verification_radius: verificationRadius,
          device_info: deviceInfo || {},
          points_awarded: activity.reward_points || 10
        })
        .select()
        .single();

      if (checkinError) {
        console.error('❌ Checkin record creation failed:', checkinError);
        return {
          success: false,
          error: '签到记录创建失败'
        };
      }

      // 更新参与记录
      const { error: updateError } = await supabaseAdmin
        .from('activity_participants')
        .update({
          checked_in: true,
          checkin_time: checkinTime.toISOString(),
          checkin_location: userLocation || {},
          distance_from_venue: distance,
          location_verified: locationVerified
        })
        .eq('id', participationId);

      if (updateError) {
        console.error('❌ Participation update failed:', updateError);
        // 可以考虑回滚checkin记录，但为了简化暂时不处理
      }

      // 奖励积分 (这里可以调用积分系统的API)
      try {
        // TODO: 调用积分服务奖励用户
        console.log(`✅ User ${userId} checked in to activity ${activityId}, awarded ${activity.reward_points || 10} points`);
      } catch (pointsError) {
        console.error('❌ Points reward failed:', pointsError);
        // 积分失败不影响签到成功
      }

      console.log(`✅ User ${userId} successfully checked in to activity ${activity.title}`);

      return {
        success: true,
        message: '签到成功！',
        checkinTime,
        distance: Math.round(distance),
        locationVerified,
        pointsAwarded: activity.reward_points || 10,
        checkinRecord
      };

    } catch (error) {
      console.error('❌ Perform checkin failed:', error);
      return {
        success: false,
        error: '签到失败，请重试'
      };
    }
  }

  // 获取活动签到统计
  async getActivityCheckinStats(activityId) {
    try {
      // 获取总参与人数
      const { count: totalParticipants } = await supabaseAdmin
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      // 获取已签到人数
      const { count: checkedInCount } = await supabaseAdmin
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId)
        .eq('checked_in', true);

      // 获取签到详情
      const { data: checkinDetails, error } = await supabaseAdmin
        .from('activity_checkins')
        .select(`
          id,
          checkin_time,
          distance_meters,
          location_verified,
          points_awarded,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('activity_id', activityId)
        .order('checkin_time', { ascending: false });

      if (error) {
        console.error('❌ Get checkin stats failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        stats: {
          totalParticipants: totalParticipants || 0,
          checkedInCount: checkedInCount || 0,
          checkinRate: totalParticipants > 0 ? ((checkedInCount || 0) / totalParticipants * 100).toFixed(1) : '0',
          checkinDetails: checkinDetails || []
        }
      };

    } catch (error) {
      console.error('❌ Get activity checkin stats failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户的签到历史
  async getUserCheckinHistory(userId, params = {}) {
    try {
      const { limit = 20, offset = 0 } = params;

      const { data: checkins, error, count } = await supabaseAdmin
        .from('activity_checkins')
        .select(`
          *,
          activity:activities!activity_id(
            id,
            title,
            category,
            start_time,
            end_time,
            location
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('checkin_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Get user checkin history failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        checkins: checkins || [],
        total: count
      };

    } catch (error) {
      console.error('❌ Get user checkin history failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const activityCheckinService = new ActivityCheckinService();
export default activityCheckinService;