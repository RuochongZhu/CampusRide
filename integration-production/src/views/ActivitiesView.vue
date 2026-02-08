<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-4 md:pt-8 pb-8 md:pb-16 max-w-7xl mx-auto px-3 md:px-4">

      <!-- Groups Grid -->
      <div class="mb-4 md:mb-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
          <h2 class="text-xl md:text-2xl font-bold text-[#333333]">Campus Groups</h2>
          <div class="flex flex-wrap items-center gap-2">
            <a-button
              type="default"
              size="small"
              class="!rounded-button text-xs md:text-sm h-8 flex items-center"
              @click="showBrowseGroupsModal = true"
            >
              <TeamOutlined /> <span class="hidden sm:inline ml-1">Browse</span>
            </a-button>
            <a-button
              type="default"
              size="small"
              class="!rounded-button text-xs md:text-sm h-8 flex items-center"
              @click="showCreateGroupModal = true"
            >
              <PlusOutlined /> <span class="hidden sm:inline ml-1">Create</span>
            </a-button>
            <a-button
              type="primary"
              size="small"
              class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35] text-xs md:text-sm h-8 flex items-center"
              @click="showPostThoughtModal = true"
            >
              <EditOutlined /> <span class="hidden sm:inline ml-1">Post Activity</span>
            </a-button>
            <a-button
              type="default"
              size="small"
              class="!rounded-button text-xs md:text-sm h-8 hidden sm:flex items-center"
              @click="() => $router.push('/activities/history')"
            >
              <HistoryOutlined class="mr-1" /> History
            </a-button>
            <a-button
              :type="isVisible ? 'default' : 'dashed'"
              size="small"
              class="!rounded-button text-xs md:text-sm h-8 flex items-center"
              @click="toggleVisibility"
            >
              <EyeOutlined v-if="isVisible" />
              <EyeInvisibleOutlined v-else />
              <span class="hidden sm:inline ml-1">{{ isVisible ? 'Visible' : 'Invisible' }}</span>
            </a-button>
          </div>
        </div>


        <!-- Regular Groups Grid -->
        <div v-if="myGroups.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          <div
            v-for="group in myGroups"
            :key="group.id"
            class="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-all cursor-pointer"
            :class="selectedGroupId === group.id ? 'ring-2 ring-[#C24D45]' : ''"
            @click="selectGroup(group)"
          >
            <div class="flex items-center justify-between mb-2 md:mb-4">
              <h3 class="text-base md:text-lg font-medium text-[#333333] truncate">{{ group.name }}</h3>
            </div>
            <p class="text-xs md:text-sm text-[#666666] mb-3 md:mb-4 line-clamp-2">{{ group.description || 'No description' }}</p>
            <div class="flex items-center justify-between text-xs md:text-sm">
              <div class="flex items-center text-gray-500">
                <TeamOutlined class="mr-1" />
                <span>{{ group.member_count || 0 }}</span>
              </div>
              <div class="flex items-center space-x-1 md:space-x-2">
                <a-button
                  type="primary"
                  size="small"
                  class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35] whitespace-nowrap text-xs h-7"
                  @click.stop="openGroupChat(group)"
                >
                  <MessageOutlined />
                  <span class="hidden sm:inline ml-1">Chat</span>
                </a-button>
                <a-button
                  v-if="group.my_role === 'creator'"
                  type="default"
                  danger
                  size="small"
                  class="!rounded-button whitespace-nowrap text-xs h-7 hidden sm:inline-flex"
                  @click.stop="deleteGroupHandler(group.id)"
                >
                  Delete
                </a-button>
                <a-button
                  v-else
                  type="default"
                  danger
                  size="small"
                  class="!rounded-button whitespace-nowrap text-xs h-7 hidden sm:inline-flex"
                  @click.stop="leaveGroupHandler(group.id)"
                >
                  Leave
                </a-button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="myGroups.length === 0" class="text-center py-8 md:py-12 text-gray-400">
          <TeamOutlined class="text-4xl md:text-5xl mb-3 md:mb-4" />
          <p class="text-sm md:text-base">You haven't joined any groups yet</p>
          <a-button
            type="primary"
            size="small"
            class="mt-3 md:mt-4 !rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
            @click="showBrowseGroupsModal = true"
          >
            Browse Groups
          </a-button>
        </div>
      </div>

      <!-- Activity Feed Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div class="flex flex-col gap-3 md:gap-4 mb-4">
              <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <a-radio-group v-model:value="feedFilter" button-style="solid" size="small">
                  <a-radio-button value="all">All</a-radio-button>
                  <a-radio-button value="groups">My Groups</a-radio-button>
                  <a-radio-button value="urgent">Urgent</a-radio-button>
                </a-radio-group>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div class="flex items-center">
                  <span class="text-xs md:text-sm text-[#666666] mr-2">Dist:</span>
                  <a-slider v-model:value="distanceFilter" :min="500" :max="5000" :step="500" class="w-20 md:w-32" />
                  <span class="text-xs md:text-sm text-[#666666] ml-2">{{ distanceFilter / 1000 }}km</span>
                </div>
                <a-select v-model:value="sortOption" class="w-24 md:w-32" size="small">
                  <a-select-option value="newest">Newest</a-select-option>
                  <a-select-option value="closest">Closest</a-select-option>
                </a-select>
              </div>
            </div>

            <!-- Activity Cards -->
            <div v-if="activitiesLoading" class="py-8 md:py-12 flex justify-center">
              <a-spin />
            </div>
            <div v-else-if="activitiesError" class="py-8 md:py-12 text-center text-red-500 text-sm">
              {{ activitiesError }}
            </div>
            <div v-else-if="filteredActivities.length === 0" class="py-8 md:py-12 text-center text-gray-500">
              <p class="text-base md:text-lg font-medium mb-1 md:mb-2">No activities found</p>
              <p class="text-xs md:text-sm">Try adjusting your filters or create a new activity.</p>
            </div>
            <div v-else class="space-y-4 md:space-y-6">
              <div
                v-for="activity in paginatedActivities"
                :key="activity.id"
                class="bg-[#FAFAFA] rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                @mouseenter="highlightRadarDot(activity.id)"
                @mouseleave="resetRadarDot()"
              >
                <div class="flex justify-between items-start">
                  <div class="flex space-x-2 md:space-x-3">
                    <ClickableAvatar :user="activity.user" :size="32" @message="handleUserMessage" />
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1 md:gap-2">
                        <h3 class="font-medium text-sm md:text-base text-[#333333] truncate max-w-[150px] md:max-w-none">{{ activity.title }}</h3>
                        <a-tag :color="activity.category.color" class="text-xs">{{ activity.category.name }}</a-tag>
                      </div>
                      <div class="flex items-center text-xs md:text-sm text-[#666666] space-x-1 md:space-x-2">
                        <span class="truncate max-w-[80px] md:max-w-none">{{ activity.user.name }}</span>
                        <span>•</span>
                        <span class="truncate max-w-[60px] md:max-w-none">{{ activity.group }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-xs text-[#666666] whitespace-nowrap ml-2">{{ activity.timeAgo }}</div>
                </div>

                <p class="text-xs md:text-sm text-[#333333] my-2 md:my-3 line-clamp-2">{{ activity.description }}</p>

                <div class="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                  <a-tag v-for="tag in activity.tags.slice(0, 3)" :key="tag" color="blue" class="text-xs">{{ tag }}</a-tag>
                  <span v-if="activity.tags.length > 3" class="text-xs text-gray-400">+{{ activity.tags.length - 3 }}</span>
                </div>

                <div class="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-[#666666] mb-2 md:mb-3">
                  <div class="flex items-center">
                    <EnvironmentOutlined class="mr-1" />
                    <span class="truncate max-w-[100px] md:max-w-none">{{ activity.locationLabel }}</span>
                  </div>
                  <div class="flex items-center">
                    <ClockCircleOutlined class="mr-1" />
                    <span>{{ activity.expiresIn }}</span>
                  </div>
                </div>

                <!-- Info tags and action buttons -->
                <div class="flex items-center justify-between gap-2">
                  <!-- Status tags -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <span v-if="activity.entry_fee && activity.entry_fee > 0" class="text-xs text-orange-600">💰</span>
                    <a-tag v-if="activity.status === 'completed'" color="gray" class="text-xs !m-0">Done</a-tag>
                    <a-tag v-else-if="activity.isOwner" color="blue" class="text-xs !m-0">Mine</a-tag>
                    <a-tag v-else-if="activity.isRegistered" color="green" class="text-xs !m-0">Joined</a-tag>
                  </div>

                  <!-- Action buttons - role-based -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <a-button
                      v-for="action in getActivityActions(activity)"
                      :key="`${activity.id}-${action.key}`"
                      size="small"
                      :type="action.type"
                      :class="action.className"
                      :disabled="action.disabled"
                      :loading="action.loading"
                      @click.stop="handleActivityAction(action.key, activity)"
                    >
                      <component :is="action.icon" v-if="action.icon" />
                      <span v-if="action.label" class="hidden sm:inline ml-1">{{ action.label }}</span>
                    </a-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div class="mt-4 md:mt-6 flex justify-center">
              <a-pagination
                v-model:current="currentPage"
                :total="paginationTotal"
                :page-size="PAGE_SIZE"
                size="small"
                :simple="true"
              />
            </div>
          </div>
        </div>

        <!-- Right Sidebar - Hidden on mobile, shown as collapsible on tablet -->
        <div class="hidden lg:block space-y-4 md:space-y-6">
          <!-- Nearby Radar Widget -->
          <div class="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div class="flex justify-between items-center mb-3 md:mb-4">
              <h2 class="text-base md:text-lg font-medium text-[#333333]">Nearby Radar</h2>
              <a-button
                type="link"
                size="small"
                class="text-[#C24D45]"
                @click="toggleMapExpand"
              >
                {{ isMapExpanded ? 'Collapse' : 'Expand' }}
              </a-button>
            </div>

            <!-- Google Maps Container -->
            <div id="small-map" class="relative bg-[#F5F5F5] rounded-lg overflow-hidden mb-3 md:mb-4 h-48 md:h-64"></div>

            <!-- Radar Legend -->
            <div class="flex flex-wrap justify-between gap-2 text-xs text-[#666666]">
              <div class="flex items-center">
                <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 mr-1"></div>
                <span>Activities</span>
              </div>
              <div class="flex items-center">
                <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Users</span>
              </div>
              <div class="flex items-center">
                <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 mr-1"></div>
                <span>Me</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expanded Map Modal -->
      <a-modal
        v-model:open="isMapExpanded"
        title="Nearby Radar - Expanded View"
        :footer="null"
        width="90%"
        :style="{ top: '20px' }"
        class="radar-modal"
        @cancel="isMapExpanded = false"
      >
        <div id="large-map" class="relative bg-[#F5F5F5] rounded-lg overflow-hidden" style="height: 70vh;"></div>
      </a-modal>

      <!-- Create Group弹窗 -->
      <CreateGroupModal
        :open="showCreateGroupModal"
        @update:open="showCreateGroupModal = $event"
        @success="handleGroupCreated"
      />

      <!-- Post Activity弹窗 -->
      <PostThoughtModal
        :open="showPostThoughtModal"
        @update:open="showPostThoughtModal = $event"
        :my-groups="myGroups"
        :default-group="selectedGroupId"
        @success="handleThoughtPosted"
      />

      <!-- 群组聊天弹窗 -->
      <GroupChatModal
        v-model:visible="showGroupChatModal"
        :group="selectedGroupForChat"
      />

      <!-- Browse Groups弹窗 -->
      <a-modal
        v-model:open="showBrowseGroupsModal"
        title="Browse All Groups"
        :footer="null"
        width="800px"
        @after-open="fetchAllGroups"
      >
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div
            v-for="group in allGroups"
            :key="group.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <h3 class="font-medium text-lg">{{ group.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ group.description || 'No description' }}</p>
                <div class="flex items-center mt-2 text-sm text-gray-500">
                  <TeamOutlined class="mr-1" />
                  <span>{{ group.member_count || 0 }} Members</span>
                </div>
              </div>
              <a-button
                v-if="!isGroupJoined(group.id)"
                type="primary"
                class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
                @click="joinGroupHandler(group.id)"
              >
                Join
              </a-button>
              <a-tag v-else color="success">Joined</a-tag>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- Check In弹窗 -->
      <a-modal
        v-model:open="showCheckinModal"
        title="Activity Check In"
        :footer="null"
        width="450px"
      >
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">{{ selectedActivity?.title }}</h3>
            <p class="text-sm text-gray-600 mb-4">Verify your location and time to complete check-in</p>
          </div>

          <!-- Check-in Requirements -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-blue-800 space-y-2">
              <div class="flex items-center">
                <ClockCircleOutlined class="mr-2" />
                <span>Activity Time：{{ formatDateTime(selectedActivity?.start_time) }} - {{ formatDateTime(selectedActivity?.end_time) }}</span>
              </div>
              <div class="flex items-center">
                <EnvironmentOutlined class="mr-2" />
                <span>Activity Location：{{ selectedActivity?.locationLabel }}</span>
              </div>
              <div class="flex items-center">
                <span class="mr-2">📍</span>
                <span>Must be within activity time and within {{ selectedActivity?.max_checkin_distance || 100 }} meters of the activity location</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <a-button @click="showCheckinModal = false">Cancel</a-button>
            <a-button
              type="primary"
              class="bg-[#C24D45] border-none hover:bg-[#A93C35]"
              @click="submitCheckin"
              :loading="checkinForm.checking"
            >
              {{ checkinForm.checking ? 'Verifying...' : 'Check In Now' }}
            </a-button>
          </div>
        </div>
      </a-modal>

      <!-- 参与者列表弹窗 -->
      <a-modal
        v-model:open="showParticipantsModal"
        title="Activity Participants"
        :footer="null"
        width="700px"
      >
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-medium mb-2">{{ selectedActivity?.title }}</h3>
              <div class="flex items-center space-x-4 text-sm text-gray-600">
                <span>{{ participantsList.length }} / {{ selectedActivity?.max_participants || '∞' }} participants</span>
                <span>•</span>
                <span>{{ participantsList.filter(p => p.status === 'checked_in').length }} checked in</span>
              </div>
            </div>
            <div v-if="selectedActivity?.isOwner" class="text-right">
              <a-tag color="blue">Activity Owner</a-tag>
            </div>
          </div>

          <div class="max-h-96 overflow-y-auto">
            <div
              v-for="participant in participantsList"
              :key="participant.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-4 flex-grow">
                <ClickableAvatar
                  :user="{
                    id: participant.id,
                    name: participant.name,
                    email: participant.email,
                    avatar_url: participant.avatar
                  }"
                  size="large"
                  @message="handleUserMessage"
                />
                <div class="flex-grow">
                  <div class="flex items-center space-x-2">
                    <p class="font-medium">{{ participant.name }}</p>
                    <a-tag :color="getParticipantStatusColor(participant.status)" size="small">
                      {{ getParticipantStatusText(participant.status) }}
                    </a-tag>
                  </div>
                  <p class="text-sm text-gray-500">{{ participant.email }}</p>
                  <p class="text-xs text-gray-400">Joined {{ formatJoinDate(participant.joined_at) }}</p>
                </div>
              </div>

              <div class="flex items-center space-x-2 ml-4">
                <!-- Message participant button -->
                <a-button
                  size="small"
                  class="!rounded-button"
                  @click="messageParticipant(participant)"
                >
                  <MessageOutlined />
                </a-button>

                <!-- Remove participant button (only for activity owners) -->
                <a-button
                  v-if="selectedActivity?.isOwner && participant.status !== 'checked_in'"
                  size="small"
                  danger
                  class="!rounded-button"
                  @click="removeParticipant(participant)"
                  :title="'Remove ' + participant.name"
                >
                  <DeleteOutlined />
                </a-button>

                <!-- Cannot remove if checked in -->
                <a-tooltip v-else-if="selectedActivity?.isOwner && participant.status === 'checked_in'" title="Cannot remove participant who has checked in">
                  <a-button
                    size="small"
                    disabled
                    class="!rounded-button"
                  >
                    <DeleteOutlined />
                  </a-button>
                </a-tooltip>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="participantsList.length === 0" class="text-center py-8 text-gray-400">
              <TeamOutlined class="text-4xl mb-4" />
              <p>No participants yet</p>
            </div>
          </div>

          <!-- Summary footer -->
          <div class="border-t pt-4 mt-4">
            <div class="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div class="font-medium text-blue-600">{{ participantsList.filter(p => p.status === 'registered').length }}</div>
                <div class="text-gray-500">Registered</div>
              </div>
              <div>
                <div class="font-medium text-green-600">{{ participantsList.filter(p => p.status === 'checked_in').length }}</div>
                <div class="text-gray-500">Checked In</div>
              </div>
              <div>
                <div class="font-medium text-gray-600">{{ (selectedActivity?.max_participants || 0) - participantsList.length }}</div>
                <div class="text-gray-500">Available Spots</div>
              </div>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- Check In码显示弹窗 -->
      <a-modal
        v-model:open="showCheckinCodeModal"
        title="Check-in Code Generated"
        :footer="null"
        width="450px"
      >
        <div class="text-center space-y-4">
          <div>
            <h3 class="font-medium mb-2">{{ selectedActivity?.title }}</h3>
            <p class="text-sm text-gray-600 mb-4">Share this code with participants for check-in</p>
          </div>
          <div class="bg-gray-100 rounded-lg p-6">
            <div class="text-3xl font-mono font-bold tracking-widest text-[#C24D45] mb-2">
              {{ selectedActivity?.checkin_code }}
            </div>
            <div class="text-sm text-gray-500">
              {{ formatExpirationTime(selectedActivity?.code_expires_at) }}
            </div>
          </div>

          <!-- Code expiration warning -->
          <div v-if="isCodeExpired(selectedActivity?.code_expires_at)" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="text-red-600 text-sm">
              ⚠️ This code has expired. Generate a new code to continue check-ins.
            </div>
          </div>
          <div v-else-if="selectedActivity?.code_expires_at" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="text-blue-600 text-sm">
              💡 Participants must enter this code to check in. Code expires automatically for security.
            </div>
          </div>

          <div class="flex justify-center space-x-3 pt-4">
            <a-button @click="showCheckinCodeModal = false">Close</a-button>
            <a-button
              v-if="!isCodeExpired(selectedActivity?.code_expires_at)"
              type="primary"
              class="bg-[#C24D45] border-none hover:bg-[#A93C35]"
              @click="copyCheckinCode"
            >
              Copy Code
            </a-button>
            <a-button
              v-if="isCodeExpired(selectedActivity?.code_expires_at)"
              type="primary"
              class="bg-[#52C41A] border-none hover:bg-[#45A117]"
              @click="generateCheckinCode(selectedActivity)"
            >
              Generate New Code
            </a-button>
          </div>
        </div>
      </a-modal>

      <!-- New Activity Checkin Modal -->
      <ActivityCheckinModal
        v-model:open="showActivityCheckinModal"
        :activity="selectedActivityForCheckin"
        @checkin-success="handleActivityCheckinSuccess"
      />

      <!-- Activity Chat Modal -->
      <ActivityChatModal
        v-model:visible="showActivityChatModal"
        :activity="selectedActivityForChat"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  BellOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  ShareAltOutlined,
  LikeOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined,
  QrcodeOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CarOutlined,
  ShopOutlined
} from '@ant-design/icons-vue'
import { Modal as AModal, Select as ASelect, SelectOption as ASelectOption, Tag as ATag, RadioGroup as ARadioGroup, RadioButton as ARadioButton, Slider as ASlider, Button as AButton, Pagination as APagination } from 'ant-design-vue'
import { groupAPI, thoughtAPI, visibilityAPI, activitiesAPI, pointsAPI } from '@/utils/api'
import { getPublicNameFromRaw } from '@/utils/publicName'
import CreateGroupModal from '@/components/groups/CreateGroupModal.vue'
import PostThoughtModal from '@/components/groups/PostThoughtModal.vue'
import GroupChatModal from '@/components/groups/GroupChatModal.vue'
import ActivityCheckinModal from '@/components/activities/ActivityCheckinModal.vue'
import ActivityChatModal from '@/components/activities/ActivityChatModal.vue'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useActivityFeed } from '@/composables/useActivityFeed'
import { useGroupsHub } from '@/composables/useGroupsHub'
import { useActivityMap } from '@/composables/useActivityMap'
import { useActivityCheckin } from '@/composables/useActivityCheckin'
import { useActivityParticipation } from '@/composables/useActivityParticipation'

const router = useRouter()
const authStore = useAuthStore()

const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Reactive data
const feedFilter = ref('all')
const distanceFilter = ref(1000)
const sortOption = ref('newest')
const currentPage = ref(1)

// Activities data
const activities = ref([])
const activitiesLoading = ref(false)
const activitiesError = ref(null)
const participatedActivityIds = ref(new Set())

const {
  myGroups,
  allGroups,
  selectedGroupId,
  showCreateGroupModal,
  showPostThoughtModal,
  showBrowseGroupsModal,
  showGroupChatModal,
  selectedGroupForChat,
  fetchMyGroups,
  fetchAllGroups,
  joinGroupHandler,
  leaveGroupHandler,
  deleteGroupHandler,
  selectGroup,
  handleGroupCreated,
  isGroupJoined,
  openGroupChat
} = useGroupsHub({
  groupAPI,
  onGroupChanged: async () => {
    await fetchThoughts()
    await fetchMapThoughts()
    await fetchVisibleUsers()
  },
  loadActivities: () => loadActivities()
})

const {
  isVisible,
  thoughts,
  mapThoughts,
  visibleUsers,
  activeRadarDot,
  isMapExpanded,
  hoveredDot,
  fetchThoughts,
  fetchMapThoughts,
  fetchVisibleUsers,
  toggleVisibility,
  getCurrentLocation,
  initGoogleMaps,
  toggleMapExpand,
  showDotInfo,
  hideDotInfo,
  highlightRadarDot,
  resetRadarDot,
  loadMyVisibility
} = useActivityMap({
  thoughtAPI,
  visibilityAPI,
  message,
  selectedGroupId,
  handleUserMessage: (user) => handleUserMessage(user)
})

const CATEGORY_LABELS = {
  academic: 'Academic',
  sports: 'Sports',
  social: 'Social',
  volunteer: 'Volunteer',
  career: 'Career',
  cultural: 'Cultural',
  technology: 'Technology'
}

const CATEGORY_COLORS = {
  academic: 'blue',
  sports: 'orange',
  social: 'purple',
  volunteer: 'green',
  career: 'red',
  cultural: 'cyan',
  technology: 'geekblue'
}

const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

const DEFAULT_ACTIVITY_AVATAR = 'https://via.placeholder.com/64?text=CR'

const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now'
  const now = new Date()
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hr ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} wk${diffInWeeks > 1 ? 's' : ''} ago`
}

const formatTimeUntil = (startTime, endTime) => {
  if (!startTime) return '—'
  const now = new Date()
  const start = new Date(startTime)
  if (Number.isNaN(start.getTime())) return '—'

  // Check if activity has ended
  if (endTime) {
    const end = new Date(endTime)
    if (!Number.isNaN(end.getTime()) && now >= end) {
      return 'Completed'
    }
  }

  // Check if activity has started
  if (start <= now) return 'In Progress'

  // Calculate time until start
  const diffMs = start - now
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`
  }
  return `${diffMinutes}m`
}

const formatActivity = (raw) => {
  const categoryKey = raw?.category || 'academic'
  const organizerName = raw?.organizer
    ? getPublicNameFromRaw(raw.organizer.first_name, raw.organizer.last_name, raw.organizer.email, 'Campus Organizer')
    : ''

  // Calculate time progress: from created_at to start_time
  let timeProgress = 0
  if (raw.created_at && raw.start_time) {
    const createdTime = new Date(raw.created_at).getTime()
    const startTime = new Date(raw.start_time).getTime()
    const now = Date.now()

    if (now >= startTime) {
      // Activity has started or completed
      timeProgress = 100
    } else if (now > createdTime) {
      // Activity is in waiting period
      const totalDuration = startTime - createdTime
      const elapsed = now - createdTime
      timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    }
  }

  const initialData = {
    id: raw.id,
    title: raw.title,
    category: {
      name: CATEGORY_LABELS[categoryKey] || (raw.category || 'Activity'),
      color: CATEGORY_COLORS[categoryKey] || 'blue'
    },
    user: {
      id: raw.organizer_id || raw.organizer?.id,
      email: raw.organizer?.email,
      name: organizerName || 'Campus Organizer',
      avatar: raw.organizer?.avatar_url || DEFAULT_ACTIVITY_AVATAR,
      avatar_url: raw.organizer?.avatar_url || DEFAULT_ACTIVITY_AVATAR
    },
    group: raw.organizer?.university || 'Campus Community',
    timeAgo: formatTimeAgo(raw.created_at),
    description: raw.description,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    locationLabel: raw.location || raw.location_coordinates?.address || 'Location TBD',
    distance: raw.location_coordinates ? 'Nearby' : '—',
    expiresIn: formatTimeUntil(raw.start_time, raw.end_time),
    participants: raw.current_participants || 0,
    successRate: raw.max_participants
      ? Math.min(100, Math.round(((raw.current_participants || 0) / raw.max_participants) * 100))
      : 0,
    timeProgress: timeProgress,
    status: raw.status,
    isOwner: currentUserId.value ? raw.organizer_id === currentUserId.value : false,
    isRegistered: participatedActivityIds.value.has(raw.id) || Boolean(raw.user_participation),
    current_participants: raw.current_participants || 0,
    max_participants: raw.max_participants,
    entry_fee: raw.entry_fee,
    reward_points: raw.reward_points || 0,
    checkin_code: raw.checkin_code || null,
    location_verification: Boolean(raw.location_verification),
    max_checkin_distance: raw.max_checkin_distance || 100,
    registering: false,
    cancelling: false,
    user_checked_in: raw.user_participation?.attendance_status === 'attended',
    user_participation: raw.user_participation || null,
    start_time: raw.start_time,
    end_time: raw.end_time,
    registration_deadline: raw.registration_deadline,
    organizer_id: raw.organizer_id,
    view_count: raw.view_count || 0,
    created_at: raw.created_at,
    locationCoordinates: raw.location_coordinates || null
  }

  return initialData
}

// Map data
const mapImage = 'https://readdy.ai/api/search-image?query=aerial%20view%20of%20university%20campus%20map%20with%20buildings%20paths%20and%20green%20spaces%20in%20a%20simple%20clean%20design%20style&width=400&height=300&seq=6&orientation=landscape'

const nearbyDots = ref([
  {
    id: 1,
    color: 'bg-green-500',
    top: 45,
    left: 55,
    activityInfo: 'Study Group for Midterm Exam - Looking for 3-4 people to join',
    activityId: 1
  },
  {
    id: 2,
    color: 'bg-red-500',
    top: 35,
    left: 60,
    activityInfo: 'Need Help with Physics Assignment - Quantum mechanics problems',
    activityId: 2
  },
  {
    id: 3,
    color: 'bg-red-500',
    top: 55,
    left: 40,
    activityInfo: 'Looking for Math Study Partner - Calculus II',
    activityId: null
  },
  {
    id: 4,
    color: 'bg-purple-500',
    top: 60,
    left: 65,
    activityInfo: 'Basketball Pickup Game - 4 spots available',
    activityId: 3
  },
  {
    id: 5,
    color: 'bg-green-500',
    top: 40,
    left: 35,
    activityInfo: 'Offering Free Tutoring - Calculus I & II',
    activityId: 4
  },
  {
    id: 6,
    color: 'bg-purple-500',
    top: 30,
    left: 45,
    activityInfo: 'Campus Photography Walk - Join us this afternoon',
    activityId: null
  },
  {
    id: 7,
    color: 'bg-green-500',
    top: 65,
    left: 55,
    activityInfo: 'Programming Help Available - Java & Python',
    activityId: null
  }
])

// Recent connections data
const recentConnections = ref([
  {
    id: 1,
    user1: {
      name: 'David Kim',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20asian%20male%20student%20with%20friendly%20smile%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=7&orientation=squarish'
    },
    user2: {
      name: 'Jessica Lee',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20long%20hair%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=8&orientation=squarish'
    },
    testimonial: 'David helped me understand the complex algorithms. Great study session!'
  },
  {
    id: 2,
    user1: {
      name: 'Michael Brown',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20beard%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=9&orientation=squarish'
    },
    user2: {
      name: 'Sarah Johnson',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20short%20hair%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=10&orientation=squarish'
    },
    testimonial: 'Found a great carpool partner for the semester. Saving money and the environment!'
  },
  {
    id: 3,
    user1: {
      name: 'Lisa Wang',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20asian%20female%20student%20with%20glasses%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=11&orientation=squarish'
    },
    user2: {
      name: 'James Wilson',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20friendly%20smile%20wearing%20smart%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=12&orientation=squarish'
    },
    testimonial: 'Lisa\'s tutoring helped me ace my calculus exam. Highly recommended!'
  }
])

// Activity stats
const activityStats = ref({
  studySessions: 15,
  helpRequests: 28,
  newConnections: 42
})

const loadUserParticipation = async () => {
  try {
    const response = await activitiesAPI.getMyActivities({ type: 'registered' })
    const payload = response.data?.data || {}
    const ids = (payload.activities || []).map(activity => activity.id)
    participatedActivityIds.value = new Set(ids)
  } catch (error) {
    console.warn('Failed to load participated activities:', error)
    participatedActivityIds.value = new Set()
  }
}

const loadActivities = async () => {
  try {
    activitiesLoading.value = true
    activitiesError.value = null
    const response = await activitiesAPI.getActivities({
      status: ['published', 'ongoing'],
      sortBy: 'start_time',
      sortOrder: 'asc',
      limit: 50
    })
    const payload = response.data?.data || {}
    const fetched = payload.activities || []
    activities.value = fetched.map(formatActivity)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    activitiesError.value = error.response?.data?.error?.message || 'Failed to load activities'
    message.error(activitiesError.value)
  } finally {
    activitiesLoading.value = false
  }
}

// UI helpers (view-only interactions)
const focusActivity = (activityId) => {
  if (activityId) {
    const element = document.querySelector(`[data-activity-id="${activityId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const sendMessage = (activity) => {
  alert(`Opening chat with ${activity.user.name}...`)
}

const shareActivity = (activity) => {
  navigator.share?.({
    title: activity.title,
    text: activity.description,
    url: window.location.href
  }).catch(() => {
    navigator.clipboard?.writeText(window.location.href)
    alert('Activity link copied to clipboard!')
  })
}

const joinActivity = (activity) => {
  alert(`Joined "${activity.title}"! The organizer will be notified.`)
  activity.participants++
}


const handleThoughtPosted = () => {
  fetchThoughts()
  fetchMapThoughts()
  message.success('Activity posted successfully!')
}

// Domain wiring: participation + check-in
const {
  userPoints,
  fetchUserPoints,
  registerForActivity,
  cancelRegistration,
  awardPointsForActivity
} = useActivityParticipation({
  activitiesAPI,
  pointsAPI,
  message,
  participatedActivityIds
})

const editActivity = (activity) => {
  // Navigate to edit activity page or show edit modal
  message.info('Edit functionality will be implemented in next phase')
}

const {
  showCheckinModal,
  showParticipantsModal,
  showCheckinCodeModal,
  selectedActivity,
  checkinForm,
  participantsList,
  showActivityCheckinModal,
  selectedActivityForCheckin,
  showActivityChatModal,
  selectedActivityForChat,
  showParticipants,
  openActivityChat,
  generateCheckinCode,
  canCheckin,
  openActivityCheckinModal,
  handleActivityCheckinSuccess,
  submitCheckin,
  copyCheckinCode,
  getParticipantStatusColor,
  getParticipantStatusText,
  formatJoinDate
} = useActivityCheckin({
  activities,
  activitiesAPI,
  message,
  fetchUserPoints: () => fetchUserPoints(),
  getCurrentLocation,
  getPublicNameFromRaw,
  defaultAvatar: DEFAULT_ACTIVITY_AVATAR
})

// Participants management
const removeParticipant = async (participant) => {
  try {
    participantsList.value = participantsList.value.filter(p => p.id !== participant.id)
    selectedActivity.value.current_participants--

    const activityIndex = activities.value.findIndex(a => a.id === selectedActivity.value.id)
    if (activityIndex !== -1) {
      activities.value[activityIndex].current_participants--
    }

    message.success(`Removed ${participant.name} from the activity`)
  } catch (error) {
    message.error('Failed to remove participant')
  }
}

const messageParticipant = (participant) => {
  message.info(`Opening chat with ${participant.name}...`)
}

const handleUserMessage = (user) => {
  router.push({
    path: '/messages',
    query: { userId: user.id }
  })
}

const isCodeExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

const formatExpirationTime = (expiresAt) => {
  if (!expiresAt) return 'No expiration'

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry - now

  if (diffMs <= 0) return 'Expired'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`
  }
  return `Expires in ${minutes}m`
}
// Feed orchestration
const {
  PAGE_SIZE,
  filteredActivities,
  paginationTotal,
  paginatedActivities,
  getActivityActions,
  handleActivityAction
} = useActivityFeed({
  feedFilter,
  sortOption,
  currentPage,
  activities,
  participatedActivityIds,
  handlers: {
    router,
    shareActivity: (activity) => shareActivity(activity),
    editActivity: (activity) => editActivity(activity),
    showParticipants: (activity) => showParticipants(activity),
    generateCheckinCode: (activity) => generateCheckinCode(activity),
    openActivityChat: (activity) => openActivityChat(activity),
    registerForActivity: (activity) => registerForActivity(activity),
    cancelRegistration: (activity) => cancelRegistration(activity),
    openActivityCheckinModal: (activity) => openActivityCheckinModal(activity),
    canCheckin: (activity) => canCheckin(activity)
  }
})



// Lifecycle and reactive wiring
watch(selectedGroupId, () => {
  currentPage.value = 1
  fetchThoughts()
  fetchMapThoughts()
  fetchVisibleUsers()
})

watch([feedFilter, sortOption, distanceFilter], () => {
  currentPage.value = 1
})

// Initialize on mount
onMounted(async () => {
  await fetchMyGroups()
  await fetchAllGroups()
  await loadUserParticipation()
  await loadActivities()
  await fetchThoughts()
  await fetchMapThoughts()
  await fetchVisibleUsers()
  await fetchUserPoints() // Initialize user points
  await initGoogleMaps()
  await loadMyVisibility()
})

</script>

<style scoped>
.main-content {
  flex: 1;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #C24D45;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #C24D45;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Animation classes */
.hover\:-translate-y-1:hover {
  transform: translateY(-0.25rem);
}

.radar-modal .ant-modal-body {
  padding: 0;
}
</style>
