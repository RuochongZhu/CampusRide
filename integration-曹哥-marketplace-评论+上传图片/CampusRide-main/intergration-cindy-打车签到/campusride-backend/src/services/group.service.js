import { supabaseAdmin } from '../config/database.js';

class GroupService {
  // 创建小组
  async createGroup(groupData) {
    try {
      const { name, description, cover_image, creator_id } = groupData;

      // 验证必填字段
      if (!name || !creator_id) {
        throw new Error('小组名称和创建者ID是必填项');
      }

      // 创建小组
      const { data: group, error: createError } = await supabaseAdmin
        .from('groups')
        .insert({
          name,
          description,
          cover_image,
          creator_id,
          member_count: 1
        })
        .select()
        .single();

      if (createError) throw createError;

      // 自动将创建者加入小组
      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: creator_id,
          role: 'creator'
        });

      if (memberError) throw memberError;

      console.log(`✅ 小组创建成功: ${group.name} by user ${creator_id}`);

      return {
        success: true,
        group
      };
    } catch (error) {
      console.error('❌ 创建小组失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取所有小组
  async getGroups(params = {}) {
    try {
      const { limit = 20, offset = 0, search } = params;

      let query = supabaseAdmin
        .from('groups')
        .select(`
          *,
          creator:users!creator_id(
            id,
            first_name,
            last_name,
            
            university
          )
        `)
        .order('created_at', { ascending: false });

      // 搜索
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 分页
      query = query.range(offset, offset + limit - 1);

      const { data: groups, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        groups: groups || [],
        total: count
      };
    } catch (error) {
      console.error('❌ 获取小组列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取我的小组
  async getMyGroups(userId) {
    try {
      const { data: memberships, error } = await supabaseAdmin
        .from('group_members')
        .select(`
          role,
          joined_at,
          group:groups(
            *,
            creator:users!creator_id(
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const groups = memberships.map(m => ({
        ...m.group,
        my_role: m.role,
        joined_at: m.joined_at
      }));

      return {
        success: true,
        groups
      };
    } catch (error) {
      console.error('❌ 获取我的小组失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 加入小组
  async joinGroup(groupId, userId) {
    try {
      // 检查小组是否存在
      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .select('id, name')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('小组不存在');
      }

      // 检查是否已加入
      const { data: existing } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('您已经是该小组成员');
      }

      // 加入小组
      const { error: joinError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member'
        });

      if (joinError) throw joinError;

      console.log(`✅ 用户 ${userId} 加入小组 ${group.name}`);

      return {
        success: true,
        message: '成功加入小组'
      };
    } catch (error) {
      console.error('❌ 加入小组失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 退出小组
  async leaveGroup(groupId, userId) {
    try {
      // 检查是否是创建者
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new Error('您不是该小组成员');
      }

      if (membership.role === 'creator') {
        throw new Error('创建者不能退出小组，请先转让或删除小组');
      }

      // 退出小组
      const { error } = await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ 用户 ${userId} 退出小组 ${groupId}`);

      return {
        success: true,
        message: '成功退出小组'
      };
    } catch (error) {
      console.error('❌ 退出小组失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取小组成员
  async getGroupMembers(groupId) {
    try {
      const { data: members, error } = await supabaseAdmin
        .from('group_members')
        .select(`
          id,
          role,
          joined_at,
          user:users(
            id,
            first_name,
            last_name,
            
            university
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        members: members || []
      };
    } catch (error) {
      console.error('❌ 获取小组成员失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除小组（仅创建者）
  async deleteGroup(groupId, userId) {
    try {
      // 验证是否是创建者
      const { data: group } = await supabaseAdmin
        .from('groups')
        .select('creator_id, name')
        .eq('id', groupId)
        .single();

      if (!group) {
        throw new Error('小组不存在');
      }

      if (group.creator_id !== userId) {
        throw new Error('只有创建者可以删除小组');
      }

      // 删除小组（会级联删除成员）
      const { error } = await supabaseAdmin
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      console.log(`✅ 小组已删除: ${group.name}`);

      return {
        success: true,
        message: '小组已删除'
      };
    } catch (error) {
      console.error('❌ 删除小组失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const groupService = new GroupService();
export default groupService;
