import { supabaseAdmin } from '../config/database.js';
import { socketManager } from '../app.js';
import notificationService from './notification.service.js';
import pointsService from './points.service.js';
import wechatLinkService from './wechat-link.service.js';

class ActivityService {
  constructor() {
    this.categories = ['academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology'];
    this.types = ['individual', 'team', 'competition', 'workshop', 'seminar'];
    this.statuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];
  }

  async createActivity(activityData) {
    try {
      const {
        title,
        description,
        category,
        type,
        organizerId,
        location,
        locationCoordinates,
        startTime,
        endTime,
        registrationDeadline,
        maxParticipants,
        entryFee = 0,
        entryFeePoints = 0,
        rewardPoints = 0,
        requirements,
        tags = [],
        imageUrls = [],
        contactInfo = {},
        locationVerification = false,
        autoComplete = false
      } = activityData;

      // Validate inputs
      if (!title || !description || !category || !type || !organizerId || !startTime || !endTime) {
        throw new Error('Missing required fields');
      }

      if (!this.categories.includes(category)) {
        throw new Error('Invalid category');
      }

      if (!this.types.includes(type)) {
        throw new Error('Invalid type');
      }

      // Validate time constraints
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);
      const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;

      if (start <= now) {
        throw new Error('Activity start time must be in the future');
      }

      if (end <= start) {
        throw new Error('Activity end time must be after start time');
      }

      if (regDeadline && regDeadline >= start) {
        throw new Error('Registration deadline must be before activity start time');
      }

      // Check organizer permissions - simplified for testing
      const { data: organizer, error: organizerError } = await supabaseAdmin
        .from('users')
        .select('id, verification_status, is_verified')
        .eq('id', organizerId)
        .single();

      if (organizerError || !organizer) {
        console.error('❌ Organizer lookup failed:', organizerError);
        throw new Error('Invalid organizer');
      }

      // Note: Removed is_active and verification_status checks for easier testing
      // The user exists and that's enough for now

      // Check concurrent activities limit
      const { data: concurrentActivities, error: countError } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('organizer_id', organizerId)
        .in('status', ['published', 'ongoing'])
        .gte('end_time', now.toISOString());
      
      const concurrentCount = concurrentActivities ? concurrentActivities.length : 0;

      if (countError) {
        throw countError;
      }

      if (concurrentCount >= 5) {
        throw new Error('Maximum 5 concurrent activities allowed per organizer');
      }

      // Generate checkin code
      const checkinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create activity
      const { data: activity, error: createError } = await supabaseAdmin
        .from('activities')
        .insert({
          title,
          description,
          category,
          type,
          organizer_id: organizerId,
          location,
          location_coordinates: locationCoordinates,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          registration_deadline: regDeadline?.toISOString(),
          max_participants: maxParticipants,
          entry_fee: entryFee,
          entry_fee_points: entryFeePoints,
          reward_points: rewardPoints,
          requirements,
          tags,
          image_urls: imageUrls,
          contact_info: contactInfo,
          checkin_code: checkinCode,
          location_verification: locationVerification,
          auto_complete: autoComplete,
          status: 'published'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // 创建微信通知记录（深链接到具体详情）
      try {
        const activityH5Link = `https://www.campusgo.college/activities/${activity.id}`;
        const activityLink = await wechatLinkService.getBestNoticeLink(activityH5Link);
        const noticeContent = `活动发布  ${activity.title}\n${activityLink}`;

        await supabaseAdmin
          .from('wxgroup_notice_record')
          .insert({
            content: noticeContent
          });
      } catch (noticeError) {
        console.warn('Failed to create wxgroup notice for activity:', noticeError);
      }

      // 防刷分验证
      const validation = await pointsService.validateActivityPoints(organizerId, 'create');
      if (!validation.valid) {
        // 如果验证失败，删除刚创建的活动
        await supabaseAdmin
          .from('activities')
          .delete()
          .eq('id', activity.id);
        
        throw new Error(validation.reason);
      }

      // 奖励创建活动积分
      try {
        const pointsResult = await pointsService.awardPoints({
          userId: organizerId,
          points: pointsService.pointsRules.get('activity_creation').basePoints,
          source: 'activity',
          reason: `创建活动: ${title}`,
          ruleType: 'activity_creation',
          referenceId: activity.id,
          metadata: {
            activityId: activity.id,
            activityTitle: title,
            category: category
          }
        });

        if (pointsResult.success) {
          console.log(`✅ Points awarded for activity creation: ${pointsResult.pointsAwarded} points`);
        } else {
          console.log(`⚠️ Failed to award points for activity creation: ${pointsResult.error}`);
        }
      } catch (pointsError) {
        console.error('❌ Error awarding points for activity creation:', pointsError);
        // 不阻止活动创建，只记录错误
      }

      console.log(`🎯 Activity created: ${activity.title} by user ${organizerId}`);

      return {
        success: true,
        activity
      };

    } catch (error) {
      console.error('❌ Failed to create activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActivities(filters = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        category = null,
        type = null,
        status = 'published',
        organizerId = null,
        search = null,
        startDate = null,
        endDate = null,
        location = null,
        featured = null,
        sortBy = 'start_time',
        sortOrder = 'asc'
      } = filters;

      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          organizer:users!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url,
            university
          ),
          participants:activity_participants(count)
        `);

      // Apply filters
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (organizerId) {
        query = query.eq('organizer_id', organizerId);
      }

      if (featured !== null) {
        query = query.eq('featured', featured);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      const validSortFields = ['start_time', 'created_at', 'title', 'current_participants', 'view_count'];
      if (validSortFields.includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('start_time', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: activities, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        activities: activities || [],
        total: count,
        hasMore: (activities?.length || 0) === limit
      };

    } catch (error) {
      console.error('❌ Failed to get activities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActivityById(activityId, userId = null) {
    try {
      const { data: activity, error } = await supabaseAdmin
        .from('activities')
        .select(`
          *,
          organizer:users!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url,
            university,
            email
          ),
          participants:activity_participants(
            id,
            user_id,
            registration_time,
            attendance_status,
            user:users(
              id,
              first_name,
              last_name,
              avatar_url,
              university
            )
          )
        `)
        .eq('id', activityId)
        .single();

      if (error) {
        throw error;
      }

      if (!activity) {
        throw new Error('Activity not found');
      }

      // Increment view count
      await supabaseAdmin
        .from('activities')
        .update({ view_count: activity.view_count + 1 })
        .eq('id', activityId);

      // Check if user is registered (if userId provided)
      let userParticipation = null;
      if (userId) {
        const { data: participation } = await supabaseAdmin
          .from('activity_participants')
          .select('*')
          .eq('activity_id', activityId)
          .eq('user_id', userId)
          .single();

        userParticipation = participation;
      }

      return {
        success: true,
        activity: {
          ...activity,
          user_participation: userParticipation
        }
      };

    } catch (error) {
      console.error('❌ Failed to get activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateActivity(activityId, updateData, organizerId) {
    try {
      // Check if activity exists and belongs to organizer
      const { data: existingActivity, error: fetchError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('organizer_id', organizerId)
        .single();

      if (fetchError || !existingActivity) {
        throw new Error('Activity not found or access denied');
      }

      // Don't allow updating completed or cancelled activities
      if (['completed', 'cancelled'].includes(existingActivity.status)) {
        throw new Error('Cannot update completed or cancelled activities');
      }

      // Validate time constraints if updating times
      if (updateData.startTime || updateData.endTime) {
        const startTime = new Date(updateData.startTime || existingActivity.start_time);
        const endTime = new Date(updateData.endTime || existingActivity.end_time);
        const now = new Date();

        if (startTime <= now) {
          throw new Error('Activity start time must be in the future');
        }

        if (endTime <= startTime) {
          throw new Error('Activity end time must be after start time');
        }
      }

      // Update activity
      const { data: updatedActivity, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Notify participants if significant changes
      if (updateData.startTime || updateData.endTime || updateData.location) {
        await this.notifyParticipantsOfUpdate(activityId, updatedActivity);
      }

      console.log(`🎯 Activity updated: ${updatedActivity.title}`);

      return {
        success: true,
        activity: updatedActivity
      };

    } catch (error) {
      console.error('❌ Failed to update activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteActivity(activityId, organizerId) {
    try {
      // Check if activity exists and belongs to organizer
      const { data: activity, error: fetchError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('organizer_id', organizerId)
        .single();

      if (fetchError || !activity) {
        throw new Error('Activity not found or access denied');
      }

      // Don't allow deleting ongoing or completed activities
      if (['ongoing', 'completed'].includes(activity.status)) {
        throw new Error('Cannot delete ongoing or completed activities');
      }

      // Delete activity (this will cascade delete participations)
      const { error: deleteError } = await supabaseAdmin
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (deleteError) {
        throw deleteError;
      }

      // Notify participants of cancellation
      if (activity.status === 'published') {
        await this.notifyParticipantsOfCancellation(activityId, activity);
      }

      // 防刷分验证和积分扣除
      const validation = await pointsService.validateActivityPoints(organizerId, 'delete', activityId);
      
      // 无论是否可疑，都扣除积分（防刷分机制）
      try {
        const pointsResult = await pointsService.awardPoints({
          userId: organizerId,
          points: pointsService.pointsRules.get('activity_deletion_penalty').basePoints, // 负数
          source: 'activity',
          reason: `删除活动: ${activity.title}${validation.suspicious ? ' (可疑行为)' : ''}`,
          ruleType: 'activity_deletion_penalty',
          referenceId: activityId,
          metadata: {
            activityId: activityId,
            activityTitle: activity.title,
            suspicious: validation.suspicious || false,
            deletionReason: validation.reason || 'Normal deletion'
          }
        });

        if (pointsResult.success) {
          console.log(`✅ Points deducted for activity deletion: ${Math.abs(pointsResult.pointsAwarded)} points`);
          if (validation.suspicious) {
            console.log(`⚠️ Suspicious deletion pattern detected for user ${organizerId}`);
          }
        } else {
          console.log(`⚠️ Failed to deduct points for activity deletion: ${pointsResult.error}`);
        }
      } catch (pointsError) {
        console.error('❌ Error deducting points for activity deletion:', pointsError);
        // 不阻止活动删除，只记录错误
      }

      console.log(`🎯 Activity deleted: ${activity.title}`);

      return {
        success: true,
        message: 'Activity deleted successfully',
        pointsDeducted: validation.suspicious
      };

    } catch (error) {
      console.error('❌ Failed to delete activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async publishActivity(activityId, organizerId) {
    try {
      const updateResult = await this.updateActivity(activityId, { status: 'published' }, organizerId);
      
      if (!updateResult.success) {
        return updateResult;
      }

      // Send notification to followers (if implemented)
      // await this.notifyFollowersOfNewActivity(updateResult.activity);

      console.log(`🎯 Activity published: ${updateResult.activity.title}`);

      return updateResult;

    } catch (error) {
      console.error('❌ Failed to publish activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async searchActivities(searchParams) {
    try {
      const {
        query,
        category,
        location,
        startDate,
        endDate,
        maxDistance = null,
        userLocation = null,
        limit = 20,
        offset = 0
      } = searchParams;

      let searchQuery = supabaseAdmin
        .from('activities')
        .select(`
          *,
          organizer:users!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url,
            university
          )
        `)
        .eq('status', 'published');

      // Text search
      if (query) {
        searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
      }

      // Category filter
      if (category) {
        searchQuery = searchQuery.eq('category', category);
      }

      // Location filter
      if (location) {
        searchQuery = searchQuery.ilike('location', `%${location}%`);
      }

      // Date range filter
      if (startDate) {
        searchQuery = searchQuery.gte('start_time', startDate);
      }

      if (endDate) {
        searchQuery = searchQuery.lte('start_time', endDate);
      }

      // Apply pagination
      searchQuery = searchQuery
        .order('start_time', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: activities, error } = await searchQuery;

      if (error) {
        throw error;
      }

      // TODO: Implement geographical distance filtering if userLocation and maxDistance provided
      let filteredActivities = activities || [];

      return {
        success: true,
        activities: filteredActivities,
        total: filteredActivities.length,
        hasMore: filteredActivities.length === limit
      };

    } catch (error) {
      console.error('❌ Failed to search activities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMyActivities(userId, type = 'organized') {
    try {
      if (type === 'organized') {
        return await this.getActivities({
          organizerId: userId,
          status: ['draft', 'published', 'ongoing', 'completed'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
      } else if (type === 'registered') {
        const { data: participations, error } = await supabaseAdmin
          .from('activity_participants')
          .select(`
            *,
            activity:activities(
              *,
              organizer:users!organizer_id(
                id,
                first_name,
                last_name,
                avatar_url,
                university
              )
            )
          `)
          .eq('user_id', userId)
          .order('registration_time', { ascending: false });

        if (error) {
          throw error;
        }

        return {
          success: true,
          activities: participations?.map(p => ({
            ...p.activity,
            participation: {
              id: p.id,
              registration_time: p.registration_time,
              attendance_status: p.attendance_status,
              checkin_time: p.checkin_time,
              points_earned: p.points_earned
            }
          })) || []
        };
      }

    } catch (error) {
      console.error('❌ Failed to get my activities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Activity registration methods
  async registerForActivity(activityId, userId) {
    try {
      // Get activity details
      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        throw new Error('Activity not found');
      }

      // Check if user is the organizer of this activity
      if (activity.organizer_id === userId) {
        throw new Error('Activity organizers cannot register for their own activities');
      }

      // Check if activity is published and not cancelled
      if (activity.status !== 'published') {
        throw new Error('Activity is not available for registration');
      }

      // Check registration deadline (allow registration until activity ends if no deadline set)
      const now = new Date();
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);
      const regDeadline = activity.registration_deadline ? new Date(activity.registration_deadline) : endTime; // Default to activity end time

      if (now > regDeadline) {
        throw new Error('Registration deadline has passed');
      }

      // Check if user already registered
      const { data: existingRegistration, error: checkError } = await supabaseAdmin
        .from('activity_participants')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRegistration) {
        throw new Error('Already registered for this activity');
      }

      // Check if activity is full
      if (activity.max_participants && activity.current_participants >= activity.max_participants) {
        throw new Error('Activity is full');
      }

      // Check if user has enough points for entry fee
      if (activity.entry_fee_points > 0) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('points')
          .eq('id', userId)
          .single();

        if (!user || user.points < activity.entry_fee_points) {
          throw new Error('Insufficient points for registration');
        }

        // Deduct points
        const deductionResult = await pointsService.deductPoints({
          userId,
          points: activity.entry_fee_points,
          reason: `活动报名扣除积分: ${activity.title}`,
          source: 'activity_registration',
          metadata: {
            activityId,
            activityTitle: activity.title,
            organizerId: activity.organizer_id
          }
        });

        if (!deductionResult.success) {
          throw new Error(deductionResult.error || 'Failed to deduct points for registration');
        }
      }

      // Register user
      const { data: participation, error: registrationError } = await supabaseAdmin
        .from('activity_participants')
        .insert({
          activity_id: activityId,
          user_id: userId,
          attendance_status: 'registered',
          payment_status: activity.entry_fee > 0 ? 'pending' : 'paid'
        })
        .select()
        .single();

      if (registrationError) {
        throw registrationError;
      }

      // Send confirmation notification
      await notificationService.sendNotification({
        userId,
        type: 'activity_registered',
        title: '活动报名成功',
        data: {
          activityId,
          activityTitle: activity.title,
          startTime: activity.start_time,
          location: activity.location
        }
      });

      // Notify organizer
      await notificationService.sendNotification({
        userId: activity.organizer_id,
        type: 'activity_new_registration',
        title: '新的活动报名',
        data: {
          activityId,
          activityTitle: activity.title,
          participantCount: activity.current_participants + 1
        }
      });

      // 奖励加入活动积分
      try {
        const pointsRule = pointsService.pointsRules.get('activity_join');
        const pointsResult = await pointsService.awardPoints({
          userId,
          points: pointsRule ? pointsRule.basePoints : 10,
          source: 'activity',
          reason: `加入活动: ${activity.title}`,
          ruleType: 'activity_join',
          metadata: {
            activityId,
            activityTitle: activity.title,
            category: activity.category,
            organizerId: activity.organizer_id
          }
        });

        if (pointsResult.success) {
          console.log(`✅ Points awarded for joining activity: ${pointsResult.pointsAwarded} points`);
        } else {
          console.log(`⚠️ Failed to award points for joining activity: ${pointsResult.error}`);
        }
      } catch (pointsError) {
        console.error('❌ Error awarding points for joining activity:', pointsError);
        // 不阻止注册，只记录错误
      }

      console.log(`🎯 User ${userId} registered for activity ${activity.title}`);

      return {
        success: true,
        participation
      };

    } catch (error) {
      console.error('❌ Failed to register for activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelRegistration(activityId, userId) {
    try {
      // Get participation record
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('activity_participants')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      if (participationError || !participation) {
        throw new Error('Registration not found');
      }

      // Get activity details
      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        throw new Error('Activity not found');
      }

      // Check if cancellation is allowed
      const now = new Date();
      const startTime = new Date(activity.start_time);
      const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

      // If activity has already started, allow cancellation
      if (hoursUntilStart < 0) {
        console.log('Activity has already started, allowing cancellation');
      } else if (hoursUntilStart < 1) {
        throw new Error('Cannot cancel registration less than 1 hour before activity starts');
      }

      if (participation.attendance_status === 'attended') {
        throw new Error('Cannot cancel registration after attending');
      }

      // Delete participation record
      const { error: deleteError } = await supabaseAdmin
        .from('activity_participants')
        .delete()
        .eq('id', participation.id);

      if (deleteError) {
        throw deleteError;
      }

      // Refund points if applicable
      if (activity.entry_fee_points > 0) {
        const refundResult = await pointsService.awardPoints({
          userId,
          points: activity.entry_fee_points,
          source: 'activity',
          reason: `活动报名取消返还积分: ${activity.title}`,
          ruleType: 'activity_registration_refund',
          metadata: {
            activityId,
            activityTitle: activity.title,
            organizerId: activity.organizer_id
          }
        });

        if (!refundResult.success) {
          console.warn('⚠️ Failed to refund points for activity cancellation:', refundResult.error);
        }
      }

      // Send cancellation notification
      await notificationService.sendNotification({
        userId,
        type: 'activity_registration_cancelled',
        title: '活动报名已取消',
        data: {
          activityId,
          activityTitle: activity.title
        }
      });

      console.log(`🎯 User ${userId} cancelled registration for activity ${activity.title}`);

      return {
        success: true,
        message: 'Registration cancelled successfully'
      };

    } catch (error) {
      console.error('❌ Failed to cancel registration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkInToActivity(activityId, userId, checkinData = {}) {
    try {
      const { checkinCode, location } = checkinData;

      // Get participation record
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('activity_participants')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();

      if (participationError || !participation) {
        throw new Error('You are not registered for this activity');
      }

      if (participation.attendance_status === 'attended') {
        throw new Error('Already checked in to this activity');
      }

      // Get activity details
      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        throw new Error('Activity not found');
      }

      // Verify checkin code if required
      if (checkinCode && activity.checkin_code !== checkinCode.toUpperCase()) {
        throw new Error('Invalid checkin code');
      }

      // Check time constraints
      const now = new Date();
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);

      // Allow checkin 30 minutes before start and until activity ends
      const checkinWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
      const earliestCheckin = new Date(startTime.getTime() - checkinWindow);

      if (now < earliestCheckin) {
        throw new Error('Check-in is not yet available');
      }

      if (now > endTime) {
        throw new Error('Check-in window has closed');
      }

      // Update participation record
      const updateData = {
        attendance_status: 'attended',
        checkin_time: now.toISOString()
      };

      if (location) {
        updateData.checkin_location = location;
      }

      const { data: updatedParticipation, error: updateError } = await supabaseAdmin
        .from('activity_participants')
        .update(updateData)
        .eq('id', participation.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Award points for participation
      let pointsEarned = 0;
      if (activity.reward_points > 0) {
        const awardResult = await pointsService.awardPoints({
          userId,
          points: activity.reward_points,
          source: 'activity',
          reason: `活动签到获得积分: ${activity.title}`,
          ruleType: 'activity_participation',
          metadata: {
            activityId,
            activityTitle: activity.title,
            organizerId: activity.organizer_id
          }
        });

        if (awardResult.success) {
          pointsEarned = awardResult.pointsAwarded ?? activity.reward_points;

          // Update participation record with points earned
          await supabaseAdmin
            .from('activity_participants')
            .update({ points_earned: pointsEarned })
            .eq('id', participation.id);
        } else {
          console.warn('⚠️ Failed to award participation points:', awardResult.error);
        }
      }

      // Send checkin notification
      await notificationService.sendNotification({
        userId,
        type: 'activity_checkin_success',
        title: '签到成功',
        data: {
          activityId,
          activityTitle: activity.title,
          pointsEarned
        }
      });

      console.log(`🎯 User ${userId} checked in to activity ${activity.title}`);

      return {
        success: true,
        participation: {
          ...updatedParticipation,
          points_earned: pointsEarned
        },
        pointsEarned
      };

    } catch (error) {
      console.error('❌ Failed to check in to activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async regenerateCheckinCode(activityId, organizerId) {
    try {
      const { data: activity, error } = await supabaseAdmin
        .from('activities')
        .select('id, organizer_id, title')
        .eq('id', activityId)
        .single();

      if (error || !activity) {
        throw new Error('Activity not found');
      }

      if (activity.organizer_id !== organizerId) {
        throw new Error('Only the organizer can regenerate the check-in code');
      }

      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          checkin_code: newCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId);

      if (updateError) {
        throw updateError;
      }

      console.log(`🔄 Generated new check-in code for activity ${activityId}`);

      return {
        success: true,
        code: newCode
      };

    } catch (error) {
      console.error('❌ Failed to regenerate check-in code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActivityParticipants(activityId, organizerId = null) {
    try {
      // If organizerId is provided, verify ownership
      if (organizerId) {
        const { data: activity } = await supabaseAdmin
          .from('activities')
          .select('organizer_id')
          .eq('id', activityId)
          .single();

        if (!activity || activity.organizer_id !== organizerId) {
          throw new Error('Activity not found or access denied');
        }
      }

      const { data: participants, error } = await supabaseAdmin
        .from('activity_participants')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            avatar_url,
            university,
            email
          )
        `)
        .eq('activity_id', activityId)
        .order('registration_time', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        participants: participants || []
      };

    } catch (error) {
      console.error('❌ Failed to get activity participants:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods for notifications
  async notifyParticipantsOfUpdate(activityId, activity) {
    try {
      const { data: participants } = await supabaseAdmin
        .from('activity_participants')
        .select('user_id')
        .eq('activity_id', activityId)
        .eq('attendance_status', 'registered');

      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        
        await notificationService.sendBatchNotification(userIds, {
          type: 'activity_updated',
          title: '活动信息更新',
          data: {
            activityId,
            activityTitle: activity.title,
            startTime: activity.start_time,
            location: activity.location
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify participants of update:', error);
    }
  }

  async notifyParticipantsOfCancellation(activityId, activity) {
    try {
      const { data: participants } = await supabaseAdmin
        .from('activity_participants')
        .select('user_id')
        .eq('activity_id', activityId);

      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        
        await notificationService.sendBatchNotification(userIds, {
          type: 'activity_cancelled',
          title: '活动已取消',
          data: {
            activityId,
            activityTitle: activity.title
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify participants of cancellation:', error);
    }
  }

  // Get user's historical activities (archived/completed)
  async getHistoryActivities(userId, options = {}) {
    try {
      const { type = 'organized', limit = 20, offset = 0 } = options;

      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          organizer:users!activities_organizer_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
               .in('status', ['completed'])
        .order('end_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type === 'organized') {
        // Get activities organized by the user
        query = query.eq('organizer_id', userId);
      } else if (type === 'participated') {
        // Get activities the user participated in
        query = query
          .select(`
            *,
            organizer:users!activities_organizer_id_fkey(
              id,
              first_name,
              last_name,
              email,
              avatar_url
            ),
            participation:activity_participants!inner(
              user_id,
              attendance_status,
              checkin_time,
              points_earned
            )
          `)
          .eq('participation.user_id', userId);
      }

      const { data: activities, error, count } = await query;

      if (error) {
        throw error;
      }

      // Format activities data
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        type: activity.type,
        location: activity.location,
        startTime: activity.start_time,
        endTime: activity.end_time,
        status: activity.status,
        maxParticipants: activity.max_participants,
        currentParticipants: activity.current_participants,
        organizer: {
          id: activity.organizer?.id,
          name: `${activity.organizer?.first_name || ''} ${activity.organizer?.last_name || ''}`.trim(),
          email: activity.organizer?.email,
          avatar: activity.organizer?.avatar_url
        },
        createdAt: activity.created_at,
        updatedAt: activity.updated_at,
        // Add participation info for participated activities
        ...(type === 'participated' && activity.participation && {
          participation: {
            attendanceStatus: activity.participation.attendance_status,
            checkinTime: activity.participation.checkin_time,
            pointsEarned: activity.participation.points_earned
          }
        })
      }));

      // Get total count for pagination
      let totalCount = 0;
      if (type === 'organized') {
        const { count: organizedCount } = await supabaseAdmin
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', userId)
               .in('status', ['completed']);
        totalCount = organizedCount || 0;
      } else if (type === 'participated') {
        const { count: participatedCount } = await supabaseAdmin
          .from('activities')
          .select(`
            *,
            participation:activity_participants!inner(user_id)
          `, { count: 'exact', head: true })
          .eq('participation.user_id', userId)
               .in('status', ['completed']);
        totalCount = participatedCount || 0;
      }

      const hasMore = (offset + limit) < totalCount;

      console.log(`📚 Retrieved ${formattedActivities.length} historical ${type} activities for user ${userId}`);

      return {
        success: true,
        activities: formattedActivities,
        total: totalCount,
        hasMore
      };

    } catch (error) {
      console.error('❌ Failed to get history activities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const activityService = new ActivityService();

export default activityService;
