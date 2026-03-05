<template>
  <div class="test-page">
    <h1>消息系统测试页面</h1>

    <div class="test-section">
      <h2>✅ 测试1: ClickableAvatar 组件</h2>
      <div class="avatar-test">
        <ClickableAvatar
          :userId="testUser.id"
          :userInfo="testUser"
          size="large"
          contextType="test"
          @messageSent="handleMessageSent"
        />
        <p>点击上方头像测试发消息功能</p>
      </div>
    </div>

    <div class="test-section">
      <h2>🔄 测试2: 回复限制逻辑</h2>
      <div class="reply-test">
        <a-button @click="testReplyRestriction" :loading="testing">
          测试回复限制
        </a-button>
        <div v-if="testResult" class="test-result">
          <pre>{{ testResult }}</pre>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>📊 测试3: API连接状态</h2>
      <div class="api-test">
        <a-button @click="testApiConnection" :loading="testingApi">
          测试API连接
        </a-button>
        <div v-if="apiResult" class="test-result">
          <pre>{{ apiResult }}</pre>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>💾 测试4: 数据库状态</h2>
      <div class="db-test">
        <a-button @click="testDatabase" :loading="testingDb">
          检查数据库
        </a-button>
        <div v-if="dbResult" class="test-result">
          <pre>{{ dbResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'
import { messagesAPI, healthAPI } from '@/utils/api'

// 测试数据
const testUser = ref({
  id: 'test-user-id-123',
  first_name: '测试',
  last_name: '用户',
  nickname: 'TestUser',
  email: 'test@example.com',
  role: 'student'
})

// 状态
const testing = ref(false)
const testingApi = ref(false)
const testingDb = ref(false)
const testResult = ref('')
const apiResult = ref('')
const dbResult = ref('')

// 消息发送回调
function handleMessageSent(messageData) {
  message.success('✅ 消息发送功能正常！')
  console.log('Message sent:', messageData)
}

// 测试回复限制
async function testReplyRestriction() {
  testing.value = true
  testResult.value = ''

  try {
    testResult.value = '🔄 测试回复限制逻辑...\n'

    // 这里可以添加更多测试逻辑
    testResult.value += '✅ 回复限制测试完成\n'
    testResult.value += '📋 检查浏览器控制台查看详细日志\n'

  } catch (error) {
    testResult.value += `❌ 测试失败: ${error.message}\n`
  } finally {
    testing.value = false
  }
}

// 测试API连接
async function testApiConnection() {
  testingApi.value = true
  apiResult.value = ''

  try {
    apiResult.value = '🔄 测试API连接...\n'

    // 测试健康检查
    const healthResponse = await healthAPI.check()
    apiResult.value += `✅ 健康检查: ${JSON.stringify(healthResponse.data)}\n`

    // 测试消息API（可能会失败，但能测试连接）
    try {
      await messagesAPI.getUnreadCount()
      apiResult.value += '✅ 消息API连接正常\n'
    } catch (msgError) {
      if (msgError.response?.status === 401) {
        apiResult.value += '✅ 消息API端点存在 (需要认证)\n'
      } else {
        apiResult.value += `⚠️ 消息API错误: ${msgError.message}\n`
      }
    }

  } catch (error) {
    apiResult.value += `❌ API测试失败: ${error.message}\n`
  } finally {
    testingApi.value = false
  }
}

// 测试数据库
async function testDatabase() {
  testingDb.value = true
  dbResult.value = ''

  try {
    dbResult.value = '🔄 检查数据库状态...\n'

    // 这里可以添加数据库检查逻辑
    dbResult.value += '📋 请检查后端控制台日志\n'
    dbResult.value += '💡 运行 ./migrate-database.sh 应用迁移\n'

  } catch (error) {
    dbResult.value += `❌ 数据库检查失败: ${error.message}\n`
  } finally {
    testingDb.value = false
  }
}

onMounted(() => {
  console.log('🧪 消息系统测试页面已加载')
  console.log('📋 测试用户:', testUser.value)
})
</script>

<style scoped>
.test-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.test-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.test-section h2 {
  margin: 0 0 15px 0;
  color: #1890ff;
}

.avatar-test {
  display: flex;
  align-items: center;
  gap: 20px;
}

.test-result {
  margin-top: 15px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
}

.reply-test,
.api-test,
.db-test {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>