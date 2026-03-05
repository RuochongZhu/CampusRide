import { supabaseAdmin } from '../config/database.js';
import notificationService from './notification.service.js';
import pointsService from './points.service.js';

class ActivityCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  // 启动自动清理服务
  startCleanupService() {
    if (this.isRunning) {
      console.log('⚠️ Activity cleanup service is already running');
      return;
    }

    console.log('🚀 Starting activity cleanup service...');
    this.isRunning = true;

    // 立即执行一次清理
    this.performCleanup();

    // 每30分钟执行一次清理
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 30 * 60 * 1000); // 30 minutes

    console.log('✅ Activity cleanup service started (runs every 30 minutes)');
  }

  // 停止自动清理服务
  stopCleanupService() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Activity cleanup service stopped');
  }

  // 执行清理操作
  async performCleanup() {
    try {
      console.log('🧹 Starting activity cleanup...');
      const now = new Date();
      
      // 查找已结束的活动（结束时间超过1小时）
      const cutoffTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      
      // 查找已结束的活动（结束时间已过）
      const { data: expiredActivities, error: fetchError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .in('status', ['published', 'ongoing', 'completed'])
        .lt('end_time', now.toISOString()); // 活动已经结束

      if (fetchError) {
        console.error('❌ Error fetching expired activities:', fetchError);
        return;
      }

      if (!expiredActivities || expiredActivities.length === 0) {
        console.log('✅ No expired activities found');
        return;
      }

      console.log(`🔍 Found ${expiredActivities.length} expired activities to clean up`);

      // 处理每个过期活动
      for (const activity of expiredActivities) {
        await this.cleanupExpiredActivity(activity);
      }

      console.log(`✅ Activity cleanup completed. Processed ${expiredActivities.length} activities.`);

    } catch (error) {
      console.error('❌ Error during activity cleanup:', error);
    }
  }

  // 清理单个过期活动
  async cleanupExpiredActivity(activity) {
    try {
      console.log(`🗑️ Cleaning up expired activity: ${activity.title} (ID: ${activity.id})`);

      // 1. 通知参与者活动已结束
      await this.notifyParticipantsOfCompletion(activity);

      // 2. 给参与者发放完成奖励积分
      await this.awardCompletionPoints(activity);

      // 3. 更新活动状态为已清理
        const { error: updateError } = await supabaseAdmin
          .from('activities')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', activity.id);

      if (updateError) {
        console.error(`❌ Error updating activity ${activity.id}:`, updateError);
        return;
      }

      console.log(`✅ Activity ${activity.id} archived successfully`);

    } catch (error) {
      console.error(`❌ Error cleaning up activity ${activity.id}:`, error);
    }
  }

  // 通知参与者活动已结束
  async notifyParticipantsOfCompletion(activity) {
    try {
      // 获取所有参与者
      const { data: participants, error } = await supabaseAdmin
        .from('activity_participants')
        .select('user_id')
        .eq('activity_id', activity.id)
        .eq('attendance_status', 'registered');

      if (error || !participants) {
        console.error('❌ Error fetching participants:', error);
        return;
      }

      // 给每个参与者发送通知
      for (const participant of participants) {
        try {
          await notificationService.sendNotification({
            userId: participant.user_id,
            type: 'activity_completed',
            title: 'Activity Completed',
            message: `The activity "${activity.title}" has been completed. Thank you for participating!`,
            data: {
              activityId: activity.id,
              activityTitle: activity.title
            }
          });
        } catch (notifError) {
          console.error(`❌ Error sending notification to user ${participant.user_id}:`, notifError);
        }
      }

      console.log(`📤 Notifications sent to ${participants.length} participants`);

    } catch (error) {
      console.error('❌ Error notifying participants:', error);
    }
  }

  // 给参与者发放完成奖励积分
  async awardCompletionPoints(activity) {
    try {
      // 获取所有参与者
      const { data: participants, error } = await supabaseAdmin
        .from('activity_participants')
        .select('user_id')
        .eq('activity_id', activity.id)
        .eq('attendance_status', 'registered');

      if (error || !participants) {
        console.error('❌ Error fetching participants for points:', error);
        return;
      }

      // 给每个参与者发放积分
      for (const participant of participants) {
        try {
          const pointsResult = await pointsService.awardPoints({
            userId: participant.user_id,
            points: pointsService.pointsRules.get('activity_participation').basePoints,
            source: 'activity',
            reason: `活动完成奖励: ${activity.title}`,
            ruleType: 'activity_participation',
            referenceId: activity.id,
            metadata: {
              activityId: activity.id,
              activityTitle: activity.title,
              category: activity.category,
              completionDate: new Date().toISOString()
            }
          });

          if (pointsResult.success) {
            console.log(`✅ Awarded ${pointsResult.pointsAwarded} points to user ${participant.user_id} for activity completion`);
          }
        } catch (pointsError) {
          console.error(`❌ Error awarding points to user ${participant.user_id}:`, pointsError);
        }
      }

      console.log(`🎯 Completion points awarded to ${participants.length} participants`);

    } catch (error) {
      console.error('❌ Error awarding completion points:', error);
    }
  }

  // 手动触发清理（用于测试或管理）
  async manualCleanup() {
    console.log('🔧 Manual cleanup triggered');
    await this.performCleanup();
  }

  // 获取清理统计信息
  async getCleanupStats() {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: expiredActivities, error } = await supabaseAdmin
        .from('activities')
        .select('id, title, end_time, status')
        .in('status', ['completed', 'ongoing'])
        .lt('end_time', cutoffTime.toISOString());

      if (error) {
        throw error;
      }

      return {
        expiredCount: expiredActivities?.length || 0,
        expiredActivities: expiredActivities || [],
        nextCleanup: this.cleanupInterval ? 'Running' : 'Stopped'
      };

    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return {
        expiredCount: 0,
        expiredActivities: [],
        nextCleanup: 'Error'
      };
    }
  }
}

// Create singleton instance
const activityCleanupService = new ActivityCleanupService();

export default activityCleanupService;
