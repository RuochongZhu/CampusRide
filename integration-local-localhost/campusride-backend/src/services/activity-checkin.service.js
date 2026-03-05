import { supabaseAdmin } from '../config/database.js';

class ActivityCheckinService {

  // Format time difference
  formatTimeUntil(minutes) {
    if (minutes < 1) return 'less than 1 minute';
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours} hours ${remainingMinutes} minutes` : `${hours} hours`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days < 7) {
      return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`;
    }

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    return remainingDays > 0 ? `${weeks} weeks ${remainingDays} days` : `${weeks} weeks`;
  }

  // Check if user can check in
  async canUserCheckin(activityId, userId) {
    try {
      console.log('🔍 Starting to check user check-in eligibility:', { activityId, userId });

      // Get activity information and user participation status
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

      console.log('📊 Activity query result:', {
        found: !!activity,
        error: !!activityError,
        activityId,
        activityData: activity ? { id: activity.id, title: activity.title, status: activity.status } : null,
        errorDetails: activityError
      });

      if (activityError || !activity) {
        console.error('❌ Activity query failed:', { activityError, activityId });
        return {
          success: false,
          error: 'Activity not found',
          canCheckin: false
        };
      }

      // Check if activity has check-in enabled
      if (!activity.checkin_enabled) {
        return {
          success: true,
          canCheckin: false,
          reason: 'Check-in is not enabled for this activity',
          activity
        };
      }

      // Check activity status - allow published, upcoming, ongoing status activities to check in
      if (activity.status !== 'ongoing' && activity.status !== 'upcoming' && activity.status !== 'published') {
        return {
          success: true,
          canCheckin: false,
          reason: 'Activity has ended or been cancelled',
          activity
        };
      }

      // Check if user has registered for the activity
      console.log('🔍 Querying user participation record:', { activityId, userId });
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('activity_participants')
        .select('id, checked_in, checkin_time')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      console.log('📊 Participation record query result:', {
        found: !!participation,
        errorExists: !!participationError,
        participationData: participation,
        errorDetails: participationError
      });

      if (participationError || !participation) {
        console.log('❌ Participation record not found, user not registered for this activity');
        return {
          success: true,
          canCheckin: false,
          reason: 'You are not registered for this activity',
          activity
        };
      }

      // Check if user has already checked in
      if (participation.checked_in) {
        return {
          success: true,
          canCheckin: false,
          reason: 'You have already checked in',
          checkinTime: participation.checkin_time,
          activity
        };
      }

      // Check if within check-in time window
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
          reason: `Check-in starts in ${timeUntilStart} (${checkinStart.toLocaleString('en-US')})`,
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
          reason: `Check-in ended ${timeSinceEnd} ago (${checkinEnd.toLocaleString('en-US')})`,
          checkinPeriod: { start: checkinStart, end: checkinEnd },
          timeSinceEnd: minutesSinceEnd,
          activity
        };
      }

      // All conditions are met, user can check in
      const minutesRemaining = Math.floor((checkinEnd - now) / (1000 * 60));
      const timeRemaining = this.formatTimeUntil(minutesRemaining);

      return {
        success: true,
        canCheckin: true,
        checkinPeriod: { start: checkinStart, end: checkinEnd },
        timeRemaining: minutesRemaining,
        timeRemainingText: timeRemaining,
        requiresLocation: activity.location_verification,
        verificationRadius: activity.verification_radius || 100,
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

  // Perform check-in
  async performCheckin(activityId, userId, checkinData) {
    try {
      const { userLocation, deviceInfo } = checkinData;

      // First check if user can check in
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

      // If location verification is required
      if (requiresLocation && activityLocation && userLocation) {
        try {
          // Calculate distance
          const { data: distanceResult, error: distanceError } = await supabaseAdmin
            .rpc('calculate_distance', {
              lat1: userLocation.latitude,
              lon1: userLocation.longitude,
              lat2: activityLocation.lat || activityLocation.latitude,
              lon2: activityLocation.lng || activityLocation.longitude
            });

          if (distanceError) {
            console.error('❌ Distance calculation error:', distanceError);
            distance = 999999; // Set a large distance
          } else {
            distance = distanceResult || 0;
          }

          locationVerified = distance <= verificationRadius;

          if (!locationVerified) {
            return {
              success: false,
              error: `You are ${Math.round(distance)} meters from the activity location, which exceeds the ${verificationRadius}m check-in range`,
              distance,
              requiredRadius: verificationRadius
            };
          }
        } catch (error) {
          console.error('❌ Location verification failed:', error);
          return {
            success: false,
            error: 'Location verification failed, please try again'
          };
        }
      } else if (requiresLocation && !userLocation) {
        return {
          success: false,
          error: 'This activity requires location verification, please allow access to your location'
        };
      }

      const checkinTime = new Date();

      // Begin transaction
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
          error: 'Failed to create check-in record'
        };
      }

      // Update participation record
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
        // Could consider rolling back check-in record, but for simplicity we won't handle it for now
      }

      // Reward points (can call points system API here)
      try {
        // TODO: Call points service to reward user
        console.log(`✅ User ${userId} checked in to activity ${activityId}, awarded ${activity.reward_points || 10} points`);
      } catch (pointsError) {
        console.error('❌ Points reward failed:', pointsError);
        // Points failure does not affect check-in success
      }

      console.log(`✅ User ${userId} successfully checked in to activity ${activity.title}`);

      return {
        success: true,
        message: 'Check-in successful!',
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
        error: 'Check-in failed, please try again'
      };
    }
  }

  // Get activity check-in statistics
  async getActivityCheckinStats(activityId) {
    try {
      // Get total participants
      const { count: totalParticipants } = await supabaseAdmin
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      // Get checked-in count
      const { count: checkedInCount } = await supabaseAdmin
        .from('activity_participants')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId)
        .eq('checked_in', true);

      // Get check-in details
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

  // Get user's check-in history
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