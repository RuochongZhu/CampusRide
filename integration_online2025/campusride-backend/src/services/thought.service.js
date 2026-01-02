import { supabaseAdmin } from '../config/database.js';

class ThoughtService {
  // 发布想法
  async createThought(thoughtData) {
    try {
      const { user_id, group_id, content, location } = thoughtData;

      // 验证必填字段
      if (!user_id || !content || !location) {
        throw new Error('用户ID、内容和位置是必填项');
      }

      if (!location.lat || !location.lng) {
        throw new Error('位置必须包含经纬度');
      }

      // 如果指定了小组，验证用户是否是成员
      if (group_id) {
        const { data: member } = await supabaseAdmin
          .from('group_members')
          .select('id')
          .eq('group_id', group_id)
          .eq('user_id', user_id)
          .single();

        if (!member) {
          throw new Error('您不是该小组成员，无法发布到该小组');
        }
      }

      // 创建想法
      const { data: thought, error } = await supabaseAdmin
        .from('thoughts')
        .insert({
          user_id,
          group_id: group_id || null,
          content,
          location
        })
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            
            university
          ),
          group:groups(
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      console.log(`✅ 想法发布成功: ${user_id} -> ${group_id ? 'Group ' + group_id : 'Global'}`);

      return {
        success: true,
        thought
      };
    } catch (error) {
      console.error('❌ 发布想法失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取想法列表（时间线）
  async getThoughts(params = {}) {
    try {
      const { group_id, limit = 20, offset = 0 } = params;

      let query = supabaseAdmin
        .from('thoughts')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            
            university
          ),
          group:groups(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // 筛选小组
      if (group_id) {
        query = query.eq('group_id', group_id);
      }

      // 分页
      query = query.range(offset, offset + limit - 1);

      const { data: thoughts, error } = await query;

      if (error) throw error;

      return {
        success: true,
        thoughts: thoughts || []
      };
    } catch (error) {
      console.error('❌ 获取想法列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取地图上的想法点位
  async getMapThoughts(params = {}) {
    try {
      const { group_id } = params;

      let query = supabaseAdmin
        .from('thoughts')
        .select(`
          id,
          content,
          location,
          created_at,
          user:users(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      // 筛选小组
      if (group_id) {
        query = query.eq('group_id', group_id);
      }

      const { data: thoughts, error } = await query;

      if (error) throw error;

      return {
        success: true,
        thoughts: thoughts || []
      };
    } catch (error) {
      console.error('❌ 获取地图想法失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除想法
  async deleteThought(thoughtId, userId) {
    try {
      // 验证权限
      const { data: thought } = await supabaseAdmin
        .from('thoughts')
        .select('user_id')
        .eq('id', thoughtId)
        .single();

      if (!thought) {
        throw new Error('想法不存在');
      }

      if (thought.user_id !== userId) {
        throw new Error('只能删除自己的想法');
      }

      // 删除想法
      const { error } = await supabaseAdmin
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) throw error;

      console.log(`✅ 想法已删除: ${thoughtId}`);

      return {
        success: true,
        message: '想法已删除'
      };
    } catch (error) {
      console.error('❌ 删除想法失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户的想法
  async getUserThoughts(userId) {
    try {
      const { data: thoughts, error } = await supabaseAdmin
        .from('thoughts')
        .select(`
          *,
          group:groups(
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        thoughts: thoughts || []
      };
    } catch (error) {
      console.error('❌ 获取用户想法失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const thoughtService = new ThoughtService();
export default thoughtService;
