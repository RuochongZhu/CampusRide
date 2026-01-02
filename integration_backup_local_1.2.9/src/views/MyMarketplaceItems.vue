<template>
  <div class="my-items-page">
    <div class="page-header">
      <h2>My Items</h2>
      <a-button
        type="primary"
        :icon="h(PlusOutlined)"
        @click="$router.push('/marketplace')"
      >
        Post New Item
      </a-button>
    </div>

    <!-- 筛选和排序 -->
    <div class="filters">
      <a-select
        v-model:value="statusFilter"
        style="width: 150px"
        @change="loadItems"
      >
        <a-select-option value="all">All Status</a-select-option>
        <a-select-option value="active">Active</a-select-option>
        <a-select-option value="sold">Sold</a-select-option>
        <a-select-option value="inactive">Inactive</a-select-option>
      </a-select>

      <a-select
        v-model:value="sortBy"
        style="width: 150px"
        @change="loadItems"
      >
        <a-select-option value="created_at">Newest First</a-select-option>
        <a-select-option value="price">Price</a-select-option>
        <a-select-option value="views_count">Most Viewed</a-select-option>
      </a-select>
    </div>

    <!-- 商品列表 -->
    <a-spin :spinning="loading">
      <div v-if="!loading && items.length > 0" class="items-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
        >
          <!-- 商品图片 -->
          <div class="item-image-wrapper">
            <img
              v-if="item.images && item.images.length > 0"
              :src="item.images[0]"
              :alt="item.title"
              class="item-image"
            />
            <div v-else class="item-no-image">
              <PictureOutlined :style="{ fontSize: '48px', color: '#ccc' }" />
            </div>

            <!-- 状态标签 -->
            <a-tag
              :color="getStatusColor(item.status)"
              class="status-tag"
            >
              {{ getStatusText(item.status) }}
            </a-tag>
          </div>

          <!-- 商品信息 -->
          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-price">${{ item.price }}</p>

            <div class="item-stats">
              <span>
                <EyeOutlined /> {{ item.views_count || 0 }}
              </span>
              <span>
                <HeartOutlined /> {{ item.favorites_count || 0 }}
              </span>
              <span>
                <CommentOutlined /> {{ item.comments_count || 0 }}
              </span>
            </div>

            <p class="item-time">Posted {{ formatTime(item.created_at) }}</p>
          </div>

          <!-- 操作按钮 -->
          <div class="item-actions">
            <a-button
              type="link"
              :icon="h(EyeOutlined)"
              @click="viewItem(item.id)"
            >
              View
            </a-button>

            <a-button
              type="link"
              :icon="h(EditOutlined)"
              @click="editItem(item)"
            >
              Edit
            </a-button>

            <a-button
              type="link"
              danger
              :icon="h(DeleteOutlined)"
              @click="confirmDelete(item)"
            >
              Delete
            </a-button>

            <a-dropdown>
              <a-button type="link" :icon="h(EllipsisOutlined)" />
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-if="item.status === 'active'"
                    @click="changeStatus(item.id, 'sold')"
                  >
                    Mark as Sold
                  </a-menu-item>
                  <a-menu-item
                    v-if="item.status === 'active'"
                    @click="changeStatus(item.id, 'inactive')"
                  >
                    Deactivate
                  </a-menu-item>
                  <a-menu-item
                    v-if="item.status === 'inactive' || item.status === 'sold'"
                    @click="changeStatus(item.id, 'active')"
                  >
                    Reactivate
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <a-empty
        v-if="!loading && items.length === 0"
        description="You haven't posted any items yet"
      >
        <a-button
          type="primary"
          @click="$router.push('/marketplace')"
        >
          Post Your First Item
        </a-button>
      </a-empty>
    </a-spin>

    <!-- 编辑模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="Edit Item"
      width="600px"
      @ok="saveEdit"
      @cancel="cancelEdit"
      :confirmLoading="editSubmitting"
    >
      <a-form
        :model="editForm"
        layout="vertical"
      >
        <a-form-item label="Title" required>
          <a-input v-model:value="editForm.title" />
        </a-form-item>

        <a-form-item label="Description" required>
          <a-textarea
            v-model:value="editForm.description"
            :rows="4"
            show-count
            :maxlength="2000"
          />
        </a-form-item>

        <a-form-item label="Price" required>
          <a-input-number
            v-model:value="editForm.price"
            :min="0"
            :step="0.01"
            prefix="$"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="Category" required>
          <a-select v-model:value="editForm.category">
            <a-select-option value="electronics">Electronics</a-select-option>
            <a-select-option value="furniture">Furniture</a-select-option>
            <a-select-option value="books">Books</a-select-option>
            <a-select-option value="clothing">Clothing</a-select-option>
            <a-select-option value="sports">Sports</a-select-option>
            <a-select-option value="other">Other</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Condition" required>
          <a-select v-model:value="editForm.condition">
            <a-select-option value="new">New</a-select-option>
            <a-select-option value="like_new">Like New</a-select-option>
            <a-select-option value="good">Good</a-select-option>
            <a-select-option value="fair">Fair</a-select-option>
            <a-select-option value="poor">Poor</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Location">
          <a-input v-model:value="editForm.location" />
        </a-form-item>

        <a-form-item label="Images">
          <MediaUploader
            v-model="editForm.images"
            :maxFiles="5"
            accept="image/*"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  PictureOutlined,
  HeartOutlined,
  CommentOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import MediaUploader from '@/components/MediaUploader.vue';

dayjs.extend(relativeTime);

const router = useRouter();

// 状态
const items = ref([]);
const loading = ref(false);
const statusFilter = ref('all');
const sortBy = ref('created_at');

// 编辑相关
const editModalVisible = ref(false);
const editSubmitting = ref(false);
const editingItem = ref(null);
const editForm = ref({
  title: '',
  description: '',
  price: 0,
  category: '',
  condition: '',
  location: '',
  images: []
});

// 加载商品
const loadItems = async () => {
  loading.value = true;

  try {
    const params = {
      sortBy: sortBy.value,
      order: 'desc'
    };

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    const response = await marketplaceAPI.getMyItems(params);

    if (response.data.success) {
      items.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Load items error:', error);
    message.error('Failed to load items');
  } finally {
    loading.value = false;
  }
};

// 查看商品
const viewItem = (itemId) => {
  router.push(`/marketplace?itemId=${itemId}`);
};

// 编辑商品
const editItem = (item) => {
  editingItem.value = item;
  editForm.value = {
    title: item.title,
    description: item.description,
    price: item.price,
    category: item.category,
    condition: item.condition,
    location: item.location || '',
    images: item.images || []
  };
  editModalVisible.value = true;
};

// 保存编辑
const saveEdit = async () => {
  if (!editForm.value.title || !editForm.value.description) {
    message.warning('Please fill in all required fields');
    return;
  }

  editSubmitting.value = true;

  try {
    const response = await marketplaceAPI.updateItem(editingItem.value.id, editForm.value);

    if (response.data.success) {
      message.success('Item updated successfully');
      editModalVisible.value = false;
      editingItem.value = null;

      // 重新加载商品
      await loadItems();
    }
  } catch (error) {
    console.error('Update item error:', error);
    message.error(error.response?.data?.error?.message || 'Failed to update item');
  } finally {
    editSubmitting.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  editingItem.value = null;
  editModalVisible.value = false;
};

// 确认删除
const confirmDelete = (item) => {
  Modal.confirm({
    title: 'Delete Item',
    content: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        await marketplaceAPI.deleteItem(item.id);
        message.success('Item deleted successfully');

        // 重新加载商品
        await loadItems();
      } catch (error) {
        console.error('Delete item error:', error);
        message.error(error.response?.data?.error?.message || 'Failed to delete item');
      }
    }
  });
};

// 更改状态
const changeStatus = async (itemId, newStatus) => {
  try {
    await marketplaceAPI.updateItem(itemId, { status: newStatus });
    message.success('Item status updated');

    // 重新加载商品
    await loadItems();
  } catch (error) {
    console.error('Update status error:', error);
    message.error('Failed to update status');
  }
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    active: 'green',
    sold: 'blue',
    inactive: 'gray'
  };
  return colors[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    active: 'Active',
    sold: 'Sold',
    inactive: 'Inactive'
  };
  return texts[status] || status;
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow();
};

// 初始化
onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.my-items-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background: white;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.item-info {
  padding: 16px;
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: #1890ff;
  margin: 0 0 12px 0;
}

.item-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.item-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-time {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.item-actions {
  display: flex;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  justify-content: space-around;
}
</style>
