import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import socketManager from '../config/socket.js';

// 创建商品
export const createItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      category,
      price,
      condition,
      location,
      images = [],
      tags = []
    } = req.body;

    // 基础验证
    if (!title || !description || !category || !price || !condition) {
      throw new AppError('Missing required fields', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 验证价格
    if (price < 0) {
      throw new AppError('Price must be positive', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 验证商品状态
    const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
    if (!validConditions.includes(condition)) {
      throw new AppError('Invalid condition', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 创建商品
    const { data: item, error } = await supabaseAdmin
      .from('marketplace_items')
      .insert({
        seller_id: userId,
        title,
        description,
        category,
        price,
        condition,
        location,
        images,
        tags,
        status: 'active'
      })
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, university)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to create item', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.status(201).json({
      success: true,
      data: { item },
      message: 'Item created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 获取商品列表
export const getItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      condition,
      minPrice,
      maxPrice,
      university,
      sortBy = 'created_at',
      order = 'desc'
    } = req.query;

    const userId = req.user?.id; // 获取当前用户ID

    // 构建查询条件
    let query = supabaseAdmin
      .from('marketplace_items')
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, university),
        favorites_count
      `)
      .eq('status', 'active');

    // 添加筛选条件
    if (category) {
      query = query.eq('category', category);
    }
    if (condition) {
      query = query.eq('condition', condition);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice && parseFloat(maxPrice) < 10000) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    if (university) {
      query = query.eq('seller.university', university);
    }

    // 排序
    const validSortFields = ['created_at', 'price', 'views_count', 'favorites_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order === 'asc' ? { ascending: true } : { ascending: false };

    query = query.order(sortField, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch items', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 为每个商品添加收藏状态
    let itemsWithFavoriteStatus = items;
    if (userId && items && items.length > 0) {
      // 获取当前用户对这些商品的收藏状态
      const itemIds = items.map(item => item.id);

      const { data: userFavorites, error: favError } = await supabaseAdmin
        .from('item_favorites')
        .select('item_id')
        .eq('user_id', userId)
        .in('item_id', itemIds);

      if (!favError) {
        const favoritedItemIds = new Set(userFavorites.map(fav => fav.item_id));

        itemsWithFavoriteStatus = items.map(item => ({
          ...item,
          is_favorited: favoritedItemIds.has(item.id)
        }));
      } else {
        // 如果获取收藏状态失败，默认为false
        itemsWithFavoriteStatus = items.map(item => ({
          ...item,
          is_favorited: false
        }));
      }
    } else {
      // 如果没有登录用户，所有商品都标记为未收藏
      itemsWithFavoriteStatus = items.map(item => ({
        ...item,
        is_favorited: false
      }));
    }

    res.json({
      success: true,
      data: {
        items: itemsWithFavoriteStatus,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || items.length,
          has_next: items.length === parseInt(limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 搜索商品
export const searchItems = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const userId = req.user?.id; // 获取当前用户ID

    let query = supabaseAdmin
      .from('marketplace_items')
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, university),
        favorites_count
      `)
      .eq('status', 'active')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    if (category) {
      query = query.eq('category', category);
    }

    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error) {
      throw new AppError('Failed to search items', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 为每个商品添加收藏状态
    let itemsWithFavoriteStatus = items;
    if (userId && items && items.length > 0) {
      // 获取当前用户对这些商品的收藏状态
      const itemIds = items.map(item => item.id);

      const { data: userFavorites, error: favError } = await supabaseAdmin
        .from('item_favorites')
        .select('item_id')
        .eq('user_id', userId)
        .in('item_id', itemIds);

      if (!favError) {
        const favoritedItemIds = new Set(userFavorites.map(fav => fav.item_id));

        itemsWithFavoriteStatus = items.map(item => ({
          ...item,
          is_favorited: favoritedItemIds.has(item.id)
        }));
      } else {
        // 如果获取收藏状态失败，默认为false
        itemsWithFavoriteStatus = items.map(item => ({
          ...item,
          is_favorited: false
        }));
      }
    } else {
      // 如果没有登录用户，所有商品都标记为未收藏
      itemsWithFavoriteStatus = items.map(item => ({
        ...item,
        is_favorited: false
      }));
    }

    res.json({
      success: true,
      data: { items: itemsWithFavoriteStatus, query: q }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个商品详情
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // 允许未登录用户访问

    const { data: item, error } = await supabaseAdmin
      .from('marketplace_items')
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, university, points)
      `)
      .eq('id', id)
      .single();

    if (error || !item) {
      throw new AppError('Item not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 增加浏览次数
    // 条件：
    // 1. 如果未登录（userId为空），总是增加浏览次数
    // 2. 如果已登录，仅当不是卖家本人时增加
    const shouldIncrementViews = !userId || (userId && item.seller_id !== userId);

    if (shouldIncrementViews) {
      console.log(`📊 Incrementing view count for item ${id}, current: ${item.views_count}`);

      // 使用原子操作增加浏览次数
      await supabaseAdmin
        .from('marketplace_items')
        .update({
          views_count: (item.views_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      item.views_count = (item.views_count || 0) + 1;
    }

    // 检查是否已收藏（仅当用户已登录时）
    if (userId) {
      const { data: favorite } = await supabaseAdmin
        .from('item_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', id)
        .single();

      item.is_favorited = !!favorite;
    } else {
      item.is_favorited = false;
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

// 更新商品
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 检查商品是否存在且属于当前用户
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('marketplace_items')
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      throw new AppError('Item not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingItem.seller_id !== userId) {
      throw new AppError('Not authorized to update this item', 403, ERROR_CODES.ACCESS_DENIED);
    }

    if (existingItem.status === 'sold') {
      throw new AppError('Cannot update sold item', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 更新商品
    const { data: updatedItem, error } = await supabaseAdmin
      .from('marketplace_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, university)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to update item', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { item: updatedItem },
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 删除商品
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查权限
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('marketplace_items')
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      throw new AppError('Item not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (item.seller_id !== userId) {
      throw new AppError('Not authorized to delete this item', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 标记为已移除而不是删除
    const { error } = await supabaseAdmin
      .from('marketplace_items')
      .update({ 
        status: 'removed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to remove item', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      message: 'Item removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 获取我的商品
export const getMyItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('marketplace_items')
      .select('*')
      .eq('seller_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error) {
      throw new AppError('Failed to fetch items', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

// 收藏商品
export const favoriteItem = async (req, res, next) => {
  try {
    const { id: itemId } = req.params;
    const userId = req.user.id;

    // 检查商品是否存在
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, seller_id, status, favorites_count')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      throw new AppError('Item not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 移除了"不能收藏自己商品"的限制，现在卖家也可以收藏自己的商品

    if (item.status !== 'active') {
      throw new AppError('Cannot favorite inactive item', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 检查是否已收藏
    const { data: existingFavorite } = await supabaseAdmin
      .from('item_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (existingFavorite) {
      throw new AppError('Item already favorited', 400, ERROR_CODES.RESOURCE_CONFLICT);
    }

    // 添加收藏
    const { data: favorite, error } = await supabaseAdmin
      .from('item_favorites')
      .insert({
        user_id: userId,
        item_id: itemId
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to favorite item', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 更新收藏数
    await supabaseAdmin
      .from('marketplace_items')
      .update({
        favorites_count: (item.favorites_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    res.status(201).json({
      success: true,
      data: { favorite },
      message: 'Item favorited successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 取消收藏
export const unfavoriteItem = async (req, res, next) => {
  try {
    const { id: itemId } = req.params;
    const userId = req.user.id;

    // 查找收藏记录
    const { data: favorite, error: fetchError } = await supabaseAdmin
      .from('item_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (fetchError || !favorite) {
      throw new AppError('Favorite not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 删除收藏
    const { error } = await supabaseAdmin
      .from('item_favorites')
      .delete()
      .eq('id', favorite.id);

    if (error) {
      throw new AppError('Failed to unfavorite item', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 更新收藏数
    const { data: item } = await supabaseAdmin
      .from('marketplace_items')
      .select('favorites_count')
      .eq('id', itemId)
      .single();

    if (item && item.favorites_count > 0) {
      await supabaseAdmin
        .from('marketplace_items')
        .update({ 
          favorites_count: item.favorites_count - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
    }

    res.json({
      success: true,
      message: 'Item unfavorited successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 获取我的收藏
export const getMyFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const { data: favorites, error } = await supabaseAdmin
      .from('item_favorites')
      .select(`
        id,
        created_at,
        item:marketplace_items(
          *,
          seller:users!seller_id(id, first_name, last_name, university)
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch favorites', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
}; 