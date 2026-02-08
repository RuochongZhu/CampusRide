import { supabaseAdmin } from '../config/database.js';

class VisibilityService {
  // 更新用户可见性
  async updateVisibility(userId, visibilityData) {
    try {
      const { is_visible, current_location } = visibilityData;

      // 检查是否已存在记录
      const { data: existing } = await supabaseAdmin
        .from('user_visibility')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      let result;

      if (existing) {
        // 更新
        const { data, error } = await supabaseAdmin
          .from('user_visibility')
          .update({
            is_visible: is_visible !== undefined ? is_visible : true,
            current_location,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // 插入
        const { data, error } = await supabaseAdmin
          .from('user_visibility')
          .insert({
            user_id: userId,
            is_visible: is_visible !== undefined ? is_visible : true,
            current_location
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log(`✅ 用户可见性已更新: ${userId} -> ${result.is_visible ? '可见' : '隐身'}`);

      return {
        success: true,
        visibility: result
      };
    } catch (error) {
      console.error('❌ 更新可见性失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取地图上可见的用户
  async getVisibleUsers(params = {}) {
    try {
      const { group_id } = params;

      // 获取可见用户
      const { data: visibleUsers, error: visError } = await supabaseAdmin
        .from('user_visibility')
        .select(`
          user_id,
          current_location,
          updated_at,
          user:users(
            id,
            first_name,
            last_name,
            avatar_url,
            email,
            university
          )
        `)
        .eq('is_visible', true)
        .not('current_location', 'is', null);

      if (visError) throw visError;

      // 如果指定了小组，只返回小组成员
      let filteredUsers = visibleUsers || [];

      if (group_id) {
        const { data: members } = await supabaseAdmin
          .from('group_members')
          .select('user_id')
          .eq('group_id', group_id);

        const memberIds = new Set(members?.map(m => m.user_id) || []);
        filteredUsers = filteredUsers.filter(u => memberIds.has(u.user_id));
      }

      // 获取每个用户的最新想法
      const usersWithThoughts = await Promise.all(
        filteredUsers.map(async (userVis) => {
          const { data: latestThought } = await supabaseAdmin
            .from('thoughts')
            .select('id, content, created_at')
            .eq('user_id', userVis.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: userVis.user_id,
            user_id: userVis.user_id,
            first_name: userVis.user?.first_name || '',
            last_name: userVis.user?.last_name || '',
            name: `${userVis.user?.first_name || ''} ${userVis.user?.last_name || ''}`.trim(),
            avatar_url: userVis.user?.avatar_url || null,
            email: userVis.user?.email || null,
            university: userVis.user?.university,
            location: userVis.current_location,
            has_thought: !!latestThought,
            latest_thought: latestThought?.content,
            latest_thought_time: latestThought?.created_at
          };
        })
      );

      return {
        success: true,
        users: usersWithThoughts
      };
    } catch (error) {
      console.error('❌ 获取可见用户失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户当前可见性状态
  async getMyVisibility(userId) {
    try {
      const { data: visibility, error } = await supabaseAdmin
        .from('user_visibility')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 如果不存在，返回默认值
      if (error && error.code === 'PGRST116') {
        return {
          success: true,
          visibility: {
            user_id: userId,
            is_visible: true,
            current_location: null,
            updated_at: new Date().toISOString()
          }
        };
      }

      if (error) throw error;

      return {
        success: true,
        visibility
      };
    } catch (error) {
      console.error('❌ 获取可见性状态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const visibilityService = new VisibilityService();
export default visibilityService;
