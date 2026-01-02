import crypto from 'crypto';
import { supabase } from '../config/database.js';
import { socketManager } from '../app.js';
import notificationService from './notification.service.js';

class PointsService {
  constructor() {
    this.pointsRules = new Map();
    this.initializePointsRules();
  }

  initializePointsRules() {
    // Define points rules for different activities
    this.pointsRules.set('activity_participation', {
      name: '活动参与',
      basePoints: 10,
      description: '参加活动获得积分',
      category: 'activity'
    });

    this.pointsRules.set('activity_checkin', {
      name: '活动签到',
      basePoints: 5,
      description: '活动签到获得积分',
      category: 'activity'
    });

    this.pointsRules.set('activity_organization', {
      name: '活动组织',
      basePoints: 20,
      description: '组织活动获得积分',
      category: 'activity'
    });

    this.pointsRules.set('activity_creation', {
      name: '活动创建',
      basePoints: 20,
      description: '创建活动获得积分',
      category: 'activity'
    });

    this.pointsRules.set('activity_join', {
      name: '活动报名',
      basePoints: 10,
      description: '报名活动获得积分',
      category: 'activity'
    });

    this.pointsRules.set('activity_registration_refund', {
      name: '活动报名退款',
      basePoints: 0,
      description: '取消活动报名返还积分',
      category: 'activity'
    });

    this.pointsRules.set('rideshare_completion', {
      name: '拼车完成',
      basePoints: 15,
      description: '完成拼车获得积分',
      category: 'rideshare'
    });

    this.pointsRules.set('marketplace_transaction', {
      name: '市场交易',
      basePoints: 8,
      description: '完成二手市场交易获得积分',
      category: 'marketplace'
    });

    this.pointsRules.set('daily_login', {
      name: '每日登录',
      basePoints: 2,
      description: '每日登录获得积分',
      category: 'system'
    });

    this.pointsRules.set('profile_completion', {
      name: '完善资料',
      basePoints: 25,
      description: '完善个人资料获得积分',
      category: 'system'
    });

    this.pointsRules.set('referral', {
      name: '推荐好友',
      basePoints: 30,
      description: '推荐好友注册获得积分',
      category: 'social'
    });

    this.pointsRules.set('feedback_submission', {
      name: '反馈提交',
      basePoints: 12,
      description: '提交有效反馈获得积分',
      category: 'system'
    });

    this.pointsRules.set('consecutive_checkin', {
      name: '连续签到奖励',
      basePoints: 5,
      multiplier: true,
      description: '连续签到获得额外积分',
      category: 'bonus'
    });
  }

  async validateActivityPoints(userId, action, activityId = null) {
    try {
      // 预留接口：这里可以加入防刷分逻辑，例如每日限额等
      return {
        valid: true
      };
    } catch (error) {
      console.error('❌ Failed to validate activity points:', error);
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  async awardPoints(options) {
    try {
      const {
        userId,
        source,
        reason,
        points,
        metadata = {},
        ruleType = null,
        multiplier = 1
      } = options;

      // Validate inputs
      if (!userId || (!points && !ruleType)) {
        throw new Error('userId and either points or ruleType are required');
      }

      let finalPoints = points;
      let finalReason = reason;

      // Apply rule-based points calculation
      if (ruleType && this.pointsRules.has(ruleType)) {
        const rule = this.pointsRules.get(ruleType);
        finalPoints = rule.basePoints;
        finalReason = finalReason || rule.description;

        // Apply multiplier for special cases (like consecutive checkin)
        if (rule.multiplier && multiplier > 1) {
          finalPoints *= multiplier;
        }
      }

      // Create transaction record
      const transaction = {
        id: crypto.randomUUID(),
        userId,
        transactionType: 'earned',
        points: finalPoints,
        source: source || 'system',
        reason: finalReason || 'Points awarded',
        ruleType: ruleType || 'custom',
        metadata,
        multiplier,
        createdAt: new Date().toISOString()
      };

      // Save transaction to database
      const { data: transactionData, error: transactionError } = await supabase
        .from('point_transactions')
        .insert(transaction)
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Update user's total points
      const { data: userData, error: userError } = await supabase
        .rpc('increment_user_points', {
          user_id: userId,
          points_to_add: finalPoints
        });

      if (userError) {
        console.error('Failed to update user points:', userError);
        // Continue anyway, transaction is recorded
      }

      // Get updated user points
      const { data: userProfile } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      const currentPoints = userProfile?.points || 0;

      // Send real-time notification
      socketManager.sendPointsUpdate(userId, {
        type: 'points_awarded',
        pointsAwarded: finalPoints,
        totalPoints: currentPoints,
        reason: finalReason,
        transaction: transactionData
      });

      // Send notification
      await notificationService.sendNotification({
        userId,
        type: 'points_earned',
        data: {
          points: finalPoints,
          reason: finalReason
        },
        channels: ['socket', 'database']
      });

      console.log(`🎯 Awarded ${finalPoints} points to user ${userId}: ${finalReason}`);

      return {
        success: true,
        transaction: transactionData,
        totalPoints: currentPoints,
        pointsAwarded: finalPoints
      };

    } catch (error) {
      console.error('❌ Failed to award points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deductPoints(options) {
    try {
      const {
        userId,
        points,
        reason,
        source = 'system',
        metadata = {}
      } = options;

      if (!userId || !points || points <= 0) {
        throw new Error('userId and positive points amount are required');
      }

      // Check if user has enough points
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userProfile || userProfile.points < points) {
        return {
          success: false,
          error: 'Insufficient points',
          available: userProfile?.points || 0,
          required: points
        };
      }

      // Create transaction record
      const transaction = {
        id: crypto.randomUUID(),
        userId,
        transactionType: 'deducted',
        points: -points, // Negative for deduction
        source,
        reason: reason || 'Points deducted',
        metadata,
        createdAt: new Date().toISOString()
      };

      // Save transaction to database
      const { data: transactionData, error: transactionError } = await supabase
        .from('point_transactions')
        .insert(transaction)
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Update user's total points
      await supabase
        .rpc('increment_user_points', {
          user_id: userId,
          points_to_add: -points
        });

      const remainingPoints = userProfile.points - points;

      // Send real-time notification
      socketManager.sendPointsUpdate(userId, {
        type: 'points_deducted',
        pointsDeducted: points,
        totalPoints: remainingPoints,
        reason,
        transaction: transactionData
      });

      console.log(`💸 Deducted ${points} points from user ${userId}: ${reason}`);

      return {
        success: true,
        transaction: transactionData,
        totalPoints: remainingPoints,
        pointsDeducted: points
      };

    } catch (error) {
      console.error('❌ Failed to deduct points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserPoints(userId) {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        points: userProfile?.points || 0
      };

    } catch (error) {
      console.error('❌ Failed to get user points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTransactionHistory(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        transactionType = null,
        source = null,
        startDate = null,
        endDate = null
      } = options;

      let query = supabase
        .from('point_transactions')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (transactionType) {
        query = query.eq('transactionType', transactionType);
      }

      if (source) {
        query = query.eq('source', source);
      }

      if (startDate) {
        query = query.gte('createdAt', startDate);
      }

      if (endDate) {
        query = query.lte('createdAt', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        transactions: data || [],
        total: count,
        hasMore: (data?.length || 0) === limit
      };

    } catch (error) {
      console.error('❌ Failed to get transaction history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPointsStatistics(userId, period = 'month') {
    try {
      let startDate;
      const now = new Date();

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('point_transactions')
        .select('transactionType, points, source, createdAt')
        .eq('userId', userId)
        .gte('createdAt', startDate.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        totalEarned: 0,
        totalSpent: 0,
        netGain: 0,
        transactionCount: data?.length || 0,
        sourceBreakdown: {},
        dailyBreakdown: {}
      };

      if (data) {
        data.forEach(transaction => {
          const points = transaction.points;
          const source = transaction.source;
          const date = new Date(transaction.createdAt).toISOString().split('T')[0];

          if (points > 0) {
            stats.totalEarned += points;
          } else {
            stats.totalSpent += Math.abs(points);
          }

          stats.netGain += points;

          // Source breakdown
          stats.sourceBreakdown[source] = (stats.sourceBreakdown[source] || 0) + points;

          // Daily breakdown
          stats.dailyBreakdown[date] = (stats.dailyBreakdown[date] || 0) + points;
        });
      }

      return {
        success: true,
        period,
        statistics: stats
      };

    } catch (error) {
      console.error('❌ Failed to get points statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async transferPoints(fromUserId, toUserId, points, reason = 'Point transfer') {
    try {
      if (!fromUserId || !toUserId || !points || points <= 0) {
        throw new Error('Valid fromUserId, toUserId, and positive points amount are required');
      }

      if (fromUserId === toUserId) {
        throw new Error('Cannot transfer points to yourself');
      }

      // Check if sender has enough points
      const senderResult = await this.getUserPoints(fromUserId);
      if (!senderResult.success || senderResult.points < points) {
        return {
          success: false,
          error: 'Insufficient points for transfer',
          available: senderResult.points || 0,
          required: points
        };
      }

      // Perform transfer using database transactions
      const { data, error } = await supabase.rpc('transfer_points', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        points_amount: points,
        transfer_reason: reason
      });

      if (error) {
        throw error;
      }

      // Send notifications to both users
      await Promise.all([
        notificationService.sendNotification({
          userId: fromUserId,
          type: 'points_transferred_out',
          data: { points, reason, toUserId },
          channels: ['socket', 'database']
        }),
        notificationService.sendNotification({
          userId: toUserId,
          type: 'points_received',
          data: { points, reason, fromUserId },
          channels: ['socket', 'database']
        })
      ]);

      return {
        success: true,
        transfer: data
      };

    } catch (error) {
      console.error('❌ Failed to transfer points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get points rules
  getPointsRules() {
    return Array.from(this.pointsRules.entries()).map(([type, rule]) => ({
      type,
      ...rule
    }));
  }

  // Add new points rule
  addPointsRule(type, rule) {
    this.pointsRules.set(type, rule);
  }

  // Calculate bonus points for consecutive actions
  calculateConsecutiveBonus(consecutiveCount, basePoints = 5) {
    if (consecutiveCount <= 1) return basePoints;
    
    // Bonus increases with consecutive days, up to a maximum
    const bonusMultiplier = Math.min(consecutiveCount / 7, 3); // Max 3x bonus
    return Math.floor(basePoints * (1 + bonusMultiplier));
  }

  // Mock method for daily login points with consecutive bonus
  async awardDailyLoginPoints(userId) {
    try {
      // Get user's last login date and consecutive days
      const { data: userProfile } = await supabase
        .from('users')
        .select('lastLoginDate, consecutiveLoginDays')
        .eq('id', userId)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = userProfile?.lastLoginDate?.split('T')[0];
      
      let consecutiveDays = userProfile?.consecutiveLoginDays || 0;
      
      if (lastLogin === today) {
        // Already logged in today
        return { success: true, alreadyRewarded: true };
      }

      // Calculate consecutive days
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLogin === yesterdayStr) {
        consecutiveDays += 1;
      } else {
        consecutiveDays = 1; // Reset streak
      }

      // Update user login info
      await supabase
        .from('users')
        .update({
          lastLoginDate: new Date().toISOString(),
          consecutiveLoginDays: consecutiveDays
        })
        .eq('id', userId);

      // Award points with consecutive bonus
      const basePoints = this.pointsRules.get('daily_login').basePoints;
      const bonusPoints = this.calculateConsecutiveBonus(consecutiveDays, basePoints);

      const result = await this.awardPoints({
        userId,
        points: bonusPoints,
        source: 'system',
        reason: `每日登录奖励 (连续${consecutiveDays}天)`,
        ruleType: 'daily_login',
        metadata: { consecutiveDays }
      });

      return {
        ...result,
        consecutiveDays,
        bonusApplied: bonusPoints > basePoints
      };

    } catch (error) {
      console.error('❌ Failed to award daily login points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const pointsService = new PointsService();

export default pointsService;
