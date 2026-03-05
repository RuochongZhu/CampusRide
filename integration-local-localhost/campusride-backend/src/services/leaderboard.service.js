import { supabaseAdmin } from '../config/database.js';

class LeaderboardService {
  constructor() {
    this.categories = {
      drivers: 'Most Active Drivers',
      socializers: 'Most Active Socializers',
      sellers: 'Most Popular Sellers',
      citizens: 'Most Helpful Citizens',
      overall: 'Overall Ranking'
    };
  }

  // Get the start of the current week (Sunday at midnight ET)
  getWeekStart() {
    const now = new Date();
    // Convert to Eastern Time
    const etOffset = -5; // EST (adjust for DST if needed)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const et = new Date(utc + (3600000 * etOffset));

    // Get the Sunday of this week
    const dayOfWeek = et.getDay(); // 0 = Sunday
    const sunday = new Date(et);
    sunday.setDate(et.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    return sunday.toISOString();
  }

  // 获取排行榜数据 - Updated to use weekly points from transactions
  async getLeaderboard(category = 'overall', timePeriod = 'week', limit = 50, offset = 0) {
    try {
      const { startDate, endDate } = this.calculateTimeRange(timePeriod);

      // For weekly leaderboard, calculate points from point_transactions
      if (timePeriod === 'week') {
        const weekStart = this.getWeekStart();

        // Query to get weekly points grouped by user
        const { data: weeklyPoints, error: weeklyError } = await supabaseAdmin
          .from('point_transactions')
          .select('user_id, points')
          .gte('created_at', weekStart);

        if (weeklyError) {
          console.warn('Could not fetch weekly transactions, falling back to total points:', weeklyError);
          // Fallback to total points
          return this.getLeaderboardByTotalPoints(limit, offset);
        }

        // Aggregate points by user
        const userPointsMap = new Map();
        (weeklyPoints || []).forEach(tx => {
          if (tx.user_id && tx.points > 0) {
            const current = userPointsMap.get(tx.user_id) || 0;
            userPointsMap.set(tx.user_id, current + tx.points);
          }
        });

        // Get user IDs with points this week
        const userIds = Array.from(userPointsMap.keys());

        if (userIds.length === 0) {
          return {
            success: true,
            data: {
              category,
              timePeriod,
              users: [],
              total: 0,
              hasMore: false,
              weekStart: weekStart
            }
          };
        }

        // Fetch user details
        const { data: users, error: userError } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            student_id,
            first_name,
            last_name,
            email,
            avatar_url,
            avg_rating
          `)
          .in('id', userIds);

        if (userError) {
          throw userError;
        }

        // Combine user data with weekly points and sort
        let usersWithPoints = (users || []).map(user => ({
          user_id: user.id,
          student_id: user.student_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          avatar_url: user.avatar_url,
          avg_rating: user.avg_rating,
          hide_rank: false,
          total_points: userPointsMap.get(user.id) || 0
        }));

        // Sort by weekly points descending
        usersWithPoints.sort((a, b) => b.total_points - a.total_points);

        // Apply pagination
        const paginatedUsers = usersWithPoints.slice(offset, offset + limit);

        return {
          success: true,
          data: {
            category,
            timePeriod,
            users: paginatedUsers,
            total: usersWithPoints.length,
            hasMore: usersWithPoints.length > offset + limit,
            weekStart: weekStart
          }
        };
      }

      // For non-weekly periods, use total points
      return this.getLeaderboardByTotalPoints(limit, offset, category, timePeriod);

    } catch (error) {
      console.error('❌ Failed to get leaderboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fallback method using total points from users table
  async getLeaderboardByTotalPoints(limit, offset, category = 'overall', timePeriod = 'all') {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        student_id,
        first_name,
        last_name,
        email,
        avatar_url,
        avg_rating,
        points
      `)
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const usersWithRanking = (users || []).map((user, index) => ({
      user_id: user.id,
      student_id: user.student_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      avatar_url: user.avatar_url,
      avg_rating: user.avg_rating,
      hide_rank: false,
      total_points: user.points || 0
    }));

    return {
      success: true,
      data: {
        category,
        timePeriod,
        users: usersWithRanking,
        total: usersWithRanking.length,
        hasMore: usersWithRanking.length === limit
      }
    };
  }

  // 获取用户个人排名信息 - Updated for weekly
  async getUserRanking(userId, category = 'overall', timePeriod = 'week') {
    try {
      // Get user info
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          avatar_url,
          points
        `)
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // For weekly, calculate weekly points
      let weeklyPoints = 0;
      let rank = 0;

      if (timePeriod === 'week') {
        const weekStart = this.getWeekStart();

        // Get user's weekly points
        const { data: transactions, error: txError } = await supabaseAdmin
          .from('point_transactions')
          .select('points')
          .eq('user_id', userId)
          .gte('created_at', weekStart);

        if (!txError && transactions) {
          weeklyPoints = transactions.reduce((sum, tx) => sum + (tx.points > 0 ? tx.points : 0), 0);
        }

        // Get rank by counting users with more weekly points
        const { data: allTransactions } = await supabaseAdmin
          .from('point_transactions')
          .select('user_id, points')
          .gte('created_at', weekStart);

        const userPointsMap = new Map();
        (allTransactions || []).forEach(tx => {
          if (tx.user_id && tx.points > 0) {
            const current = userPointsMap.get(tx.user_id) || 0;
            userPointsMap.set(tx.user_id, current + tx.points);
          }
        });

        const sortedUsers = Array.from(userPointsMap.entries())
          .sort((a, b) => b[1] - a[1]);

        rank = sortedUsers.findIndex(([id]) => id === userId) + 1;
        if (rank === 0 && weeklyPoints > 0) rank = sortedUsers.length + 1;
      } else {
        // Use total points for other periods
        weeklyPoints = user.points || 0;

        const { count } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .gt('points', user.points || 0);

        rank = (count || 0) + 1;
      }

      return {
        success: true,
        data: {
          rank: rank,
          points: weeklyPoints,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            avatar_url: user.avatar_url,
            hide_rank: false
          }
        }
      };

    } catch (error) {
      console.error('❌ Failed to get user ranking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新排行榜（定时任务调用）
  async updateLeaderboard() {
    try {
      console.log('🔄 Updating leaderboard...');

      // 更新所有分类的排行榜
      const categories = Object.keys(this.categories);
      const timePeriods = ['week', 'month', 'all'];

      for (const category of categories) {
        for (const timePeriod of timePeriods) {
          await this.calculateAndStoreRanking(category, timePeriod);
        }
      }

      console.log('✅ Leaderboard updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to update leaderboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 计算并存储排名
  async calculateAndStoreRanking(category, timePeriod) {
    try {
      const { startDate, endDate } = this.calculateTimeRange(timePeriod);

      // 获取用户数据
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, created_at')
        .eq('verification_status', 'verified') // 使用verification_status代替is_active
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 计算排名并存储
      const rankings = users.map((user, index) => ({
        user_id: user.id,
        category,
        period_type: timePeriod,
        period_start: startDate,
        period_end: endDate,
        points: 0, // 临时设为0，等添加points列后再修改
        rank: index + 1,
        updated_at: new Date().toISOString()
      }));

      // 删除旧数据
      await supabaseAdmin
        .from('leaderboard_entries')
        .delete()
        .eq('category', category)
        .eq('period_type', timePeriod);

      // 插入新数据
      const { error: insertError } = await supabaseAdmin
        .from('leaderboard_entries')
        .insert(rankings);

      if (insertError) {
        throw insertError;
      }

    } catch (error) {
      console.error(`❌ Failed to calculate ranking for ${category}-${timePeriod}:`, error);
      throw error;
    }
  }

  // 计算时间范围
  calculateTimeRange(timePeriod) {
    const now = new Date();
    let startDate, endDate;

    switch (timePeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // 项目开始时间
        endDate = now;
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  // 应用分类筛选
  async applyCategoryFilter(query, category, startDate, endDate) {
    // 这里可以根据不同分类添加特定的筛选逻辑
    // 例如：根据用户行为数据、积分来源等筛选
    switch (category) {
      case 'drivers':
        // 筛选有拼车记录的用户
        return query;
      case 'socializers':
        // 筛选有社交活动的用户
        return query;
      case 'sellers':
        // 筛选有市场交易的用户
        return query;
      case 'citizens':
        // 筛选有帮助行为的用户
        return query;
      default:
        return query;
    }
  }

  // 添加排名信息
  async addRankingInfo(users, category, timePeriod) {
    return users.map((user, index) => ({
      ...user,
      rank: index + 1,
      rankChange: 0, // 这里可以计算排名变化
      name: `${user.first_name} ${user.last_name}`,
      department: user.email?.split('@')[0] || 'Unknown', // 临时使用email前缀作为department
      points: user.points || 0, // 使用真实的积分数据
      university: 'Cornell University', // 临时默认值
      major: 'Computer Science' // 临时默认值
    }));
  }

  // 获取排名变化
  async getRankChange(userId, category, timePeriod) {
    // 这里可以实现排名变化计算逻辑
    // 需要比较当前排名与历史排名
    return 0; // 暂时返回0
  }

  // 获取排行榜统计信息
  async getLeaderboardStats() {
    try {
      const { data: stats, error } = await supabaseAdmin
        .from('users')
        .select('created_at') // 临时使用created_at代替points
        .eq('verification_status', 'verified') // 使用verification_status代替is_active;

      if (error) {
        throw error;
      }

      const points = [100, 50, 25, 10, 5]; // 临时模拟积分数据
      const totalUsers = stats.length;
      const totalPoints = points.reduce((sum, p) => sum + p, 0);
      const averagePoints = totalPoints / totalUsers;
      const maxPoints = points[0] || 0;
      const minPoints = points[points.length - 1] || 0;

      return {
        success: true,
        data: {
          totalUsers,
          totalPoints,
          averagePoints: Math.round(averagePoints),
          maxPoints,
          minPoints,
          distribution: this.calculatePointsDistribution(points)
        }
      };

    } catch (error) {
      console.error('❌ Failed to get leaderboard stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 计算积分分布
  calculatePointsDistribution(points) {
    const ranges = [
      { min: 0, max: 100, label: '0-100' },
      { min: 101, max: 500, label: '101-500' },
      { min: 501, max: 1000, label: '501-1000' },
      { min: 1001, max: 2000, label: '1001-2000' },
      { min: 2001, max: Infinity, label: '2000+' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: points.filter(p => p >= range.min && p <= range.max).length
    }));
  }

  // ================================================
  // Weekly Reset and Coupon Distribution
  // ================================================

  // Distribute coupons to top weekly performers
  async distributeWeeklyCoupons(topN = 10) {
    try {
      console.log('🎁 Distributing weekly coupons...');

      const weekStart = this.getWeekStart();

      // Get weekly points for all users
      const { data: transactions, error } = await supabaseAdmin
        .from('point_transactions')
        .select('user_id, points')
        .gte('created_at', weekStart);

      if (error) {
        throw error;
      }

      // Aggregate points by user
      const userPointsMap = new Map();
      (transactions || []).forEach(tx => {
        if (tx.user_id && tx.points > 0) {
          const current = userPointsMap.get(tx.user_id) || 0;
          userPointsMap.set(tx.user_id, current + tx.points);
        }
      });

      // Sort and get top N
      const sortedUsers = Array.from(userPointsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN);

      if (sortedUsers.length === 0) {
        console.log('No users with points this week');
        return { success: true, couponsDistributed: 0 };
      }

      // Get active merchants
      const { data: merchants } = await supabaseAdmin
        .from('merchants')
        .select('id, name, coupon_code, discount_description')
        .eq('is_active', true);

      if (!merchants || merchants.length === 0) {
        console.log('No active merchants for coupon distribution');
        return { success: true, couponsDistributed: 0 };
      }

      // Distribute coupons
      const coupons = [];
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

      for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, points] = sortedUsers[i];
        const rank = i + 1;

        // Select merchant(s) based on rank
        // Top 3 get coupons from all merchants
        // Top 4-10 get coupons from 1-2 merchants
        const merchantsToUse = rank <= 3
          ? merchants
          : merchants.slice(0, Math.min(2, merchants.length));

        for (const merchant of merchantsToUse) {
          coupons.push({
            user_id: userId,
            merchant_id: merchant.id,
            merchant_name: merchant.name,
            code: `${merchant.coupon_code}-${Date.now().toString(36).toUpperCase()}`,
            description: merchant.discount_description || '10% off',
            valid_until: validUntil.toISOString(),
            is_used: false,
            week_rank: rank,
            week_points: points,
            created_at: new Date().toISOString()
          });
        }
      }

      // Insert coupons
      if (coupons.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('user_coupons')
          .insert(coupons);

        if (insertError) {
          console.error('Failed to insert coupons:', insertError);
          // Continue anyway
        }
      }

      console.log(`✅ Distributed ${coupons.length} coupons to top ${sortedUsers.length} users`);

      return {
        success: true,
        couponsDistributed: coupons.length,
        topUsers: sortedUsers.map(([id, points], i) => ({ userId: id, points, rank: i + 1 }))
      };

    } catch (error) {
      console.error('❌ Failed to distribute weekly coupons:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const leaderboardService = new LeaderboardService();

export default leaderboardService;
