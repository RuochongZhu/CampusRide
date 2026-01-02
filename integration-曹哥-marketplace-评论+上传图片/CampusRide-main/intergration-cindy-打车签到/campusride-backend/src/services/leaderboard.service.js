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

  // 获取排行榜数据
  async getLeaderboard(category = 'overall', timePeriod = 'week', limit = 50, offset = 0) {
    try {

      // 计算时间范围
      const { startDate, endDate } = this.calculateTimeRange(timePeriod);
      
      let query = supabaseAdmin
        .from('users')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          created_at,
          points
        `)
        .eq('verification_status', 'verified') // 使用verification_status代替is_active
        .order('points', { ascending: false })
        .range(offset, offset + limit - 1);

      // 根据分类和时间范围筛选
      if (category !== 'overall') {
        // 这里可以根据不同分类添加特定的筛选逻辑
        // 例如：根据用户行为数据筛选
        query = await this.applyCategoryFilter(query, category, startDate, endDate);
      }

      const { data: users, error } = await query;

      if (error) {
        throw error;
      }

      // 计算排名变化（需要与历史数据比较）
      const usersWithRanking = await this.addRankingInfo(users, category, timePeriod);

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

    } catch (error) {
      console.error('❌ Failed to get leaderboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户个人排名信息
  async getUserRanking(userId, category = 'overall', timePeriod = 'week') {
    try {
      const { startDate, endDate } = this.calculateTimeRange(timePeriod);
      
      // 获取用户信息
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          created_at
        `)
        .eq('id', userId)
        .eq('verification_status', 'verified') // 使用verification_status代替is_active
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // 计算用户排名 - 查询创建时间晚于当前用户的用户数量（作为临时排名方案）
      let rankQuery = supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .eq('verification_status', 'verified') // 使用verification_status代替is_active
        .lt('created_at', user.created_at);

      if (category !== 'overall') {
        rankQuery = await this.applyCategoryFilter(rankQuery, category, startDate, endDate);
      }

      const { count: rankCount, error: rankError } = await rankQuery;
      
      if (rankError) {
        console.error('Error calculating rank:', rankError);
        throw rankError;
      }
      
      const rank = (rankCount || 0) + 1;

      // 获取排名变化
      const rankChange = await this.getRankChange(userId, category, timePeriod);

      return {
        success: true,
        data: {
          user: {
            ...user,
            rank,
            rankChange
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
}

// Create singleton instance
const leaderboardService = new LeaderboardService();

export default leaderboardService;
