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

      // 兼容不同数据库约束：先显式清理关联数据，再删除小组
      const safeDelete = async (table, filterColumn, value) => {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq(filterColumn, value);

        // 42P01/Postgres, PGRST205/PostgREST: table does not exist
        if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
          throw error;
        }
      };

      // Some deployments don't have ON DELETE CASCADE for group_members
      await safeDelete('group_members', 'group_id', groupId);
      await safeDelete('group_messages', 'group_id', groupId);
      await safeDelete('group_muted_users', 'group_id', groupId);

      // If members still exist, deleting groups will definitely violate FK.
      const { count: remainingMembers, error: countError } = await supabaseAdmin
        .from('group_members')
        .select('id', { head: true, count: 'exact' })
        .eq('group_id', groupId);

      if (countError && countError.code !== 'PGRST205' && countError.code !== '42P01') {
        throw countError;
      }

      if ((remainingMembers || 0) > 0) {
        throw new Error('小组成员清理失败，请稍后重试');
      }

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

  // 检查用户是否是小组成员
  async checkMembership(groupId, userId) {
    try {
      // 系统群组ID常量
      const SYSTEM_GROUP_IDS = [
        '00000000-0000-0000-0000-000000000001', // Carpooling
        '00000000-0000-0000-0000-000000000002'  // Marketplace
      ];

      // 如果是系统群组，自动添加用户
      if (SYSTEM_GROUP_IDS.includes(groupId)) {
        console.log(`🔄 Checking system group ${groupId} for user ${userId}`);

        // 尝试添加用户到系统群组（如果还不是成员）
        const { error: insertError } = await supabaseAdmin
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: userId,
            role: 'member'
          });

        // 忽略唯一约束冲突错误（用户已经是成员）
        if (insertError && insertError.code !== '23505') {
          console.error('❌ Failed to add user to system group:', insertError);
          throw insertError;
        }

        console.log(`✅ User ${userId} is member of system group ${groupId}`);

        // 系统群组成员检查总是返回true
        return {
          success: true,
          isMember: true,
          role: 'member'
        };
      }

      // 普通群组的检查逻辑
      const { data: membership, error } = await supabaseAdmin
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        isMember: !!membership,
        role: membership?.role
      };
    } catch (error) {
      console.error('❌ 检查小组成员失败:', error);
      return {
        success: false,
        error: error.message,
        isMember: false
      };
    }
  }

  // 获取小组消息
  async getGroupMessages(groupId, params = {}) {
    try {
      const { limit = 50, offset = 0 } = params;

      // 获取消息，包含发送者信息
      const { data: messages, error, count } = await supabaseAdmin
        .from('group_messages')
        .select(`
          *,
          sender:users!sender_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        messages: messages || [],
        total: count
      };
    } catch (error) {
      console.error('❌ 获取小组消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 发送小组消息
  async sendGroupMessage(groupId, userId, content) {
    try {
      // 创建消息
      const { data: message, error } = await supabaseAdmin
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: userId,
          content: content.trim()
        })
        .select(`
          *,
          sender:users!sender_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      console.log(`✅ 小组消息发送成功: 用户 ${userId} 在小组 ${groupId}`);

      return {
        success: true,
        message
      };
    } catch (error) {
      console.error('❌ 发送小组消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 禁言用户
  async muteUser(groupId, userId, mutedByUserId, reason = '') {
    try {
      const { data, error } = await supabaseAdmin
        .from('group_muted_users')
        .upsert({
          group_id: groupId,
          user_id: userId,
          muted_by: mutedByUserId,
          reason: reason,
          muted_at: new Date().toISOString(),
          unmuted_at: null
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User ${userId} muted in group ${groupId}`);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ Failed to mute user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 取消禁言用户
  async unmuteUser(groupId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('group_muted_users')
        .update({ unmuted_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User ${userId} unmuted in group ${groupId}`);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ Failed to unmute user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查用户是否被禁言
  async isUserMuted(groupId, userId) {
    try {
      const { data: muteRecord, error } = await supabaseAdmin
        .from('group_muted_users')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .is('unmuted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        isMuted: !!muteRecord,
        muteRecord
      };
    } catch (error) {
      console.error('❌ Failed to check mute status:', error);
      return {
        success: false,
        error: error.message,
        isMuted: false
      };
    }
  }

  // 撤回消息
  async deleteMessage(messageId, deletedByUserId, reason = '') {
    try {
      // 先获取消息信息
      const { data: message, error: fetchError } = await supabaseAdmin
        .from('group_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // 标记消息为已删除
      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('group_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedByUserId,
          content: '[消息已被撤回]'
        })
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 记录删除日志
      await supabaseAdmin
        .from('group_message_deletions')
        .insert({
          message_id: messageId,
          deleted_by: deletedByUserId,
          reason: reason
        });

      console.log(`✅ Message ${messageId} deleted by ${deletedByUserId}`);

      return {
        success: true,
        message: updatedMessage
      };
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查用户是否是群组管理员（创建者）
  async isGroupAdmin(groupId, userId) {
    try {
      const { data: group, error } = await supabaseAdmin
        .from('groups')
        .select('creator_id')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      return {
        success: true,
        isAdmin: group?.creator_id === userId
      };
    } catch (error) {
      console.error('❌ Failed to check admin status:', error);
      return {
        success: false,
        error: error.message,
        isAdmin: false
      };
    }
  }
}

const groupService = new GroupService();
export default groupService;
