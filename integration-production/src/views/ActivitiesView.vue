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
            @click="goToGroupDetail(group.id)"
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
                v-for="activity in filteredActivities"
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

                  <!-- Action buttons - inline row -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <a-button
                      size="small"
                      class="!rounded-button text-xs h-7 w-7 p-0 flex items-center justify-center"
                      @click.stop="() => $router.push(`/activities/${activity.id}`)"
                    >
                      <EyeOutlined />
                    </a-button>
                    <a-button
                      size="small"
                      class="!rounded-button text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center"
                      @click.stop="shareActivity(activity)"
                    >
                      <ShareAltOutlined />
                    </a-button>

                    <!-- Owner actions -->
                    <template v-if="activity.isOwner">
                      <a-button
                        size="small"
                        class="!rounded-button text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center"
                        @click.stop="editActivity(activity)"
                      >
                        <EditOutlined />
                      </a-button>
                      <a-button
                        size="small"
                        class="!rounded-button text-xs h-7 w-7 p-0 flex items-center justify-center"
                        @click.stop="showParticipants(activity)"
                      >
                        <TeamOutlined />
                      </a-button>
                      <a-button
                        v-if="activity.status === 'ongoing'"
                        type="primary"
                        size="small"
                        class="!rounded-button bg-[#52C41A] border-none hover:bg-[#45A117] text-xs h-7 w-7 p-0 flex items-center justify-center"
                        @click.stop="generateCheckinCode(activity)"
                      >
                        <QrcodeOutlined />
                      </a-button>
                    </template>

                    <!-- Participant actions -->
                    <template v-else>
                      <a-button
                        v-if="activity.isRegistered"
                        size="small"
                        class="!rounded-button bg-[#FA8C16] border-none hover:bg-[#D46B08] text-white text-xs h-7 w-7 p-0 flex items-center justify-center"
                        @click.stop="openActivityChat(activity)"
                      >
                        <MessageOutlined />
                      </a-button>

                      <template v-if="activity.status !== 'completed'">
                        <a-button
                          v-if="!activity.isRegistered"
                          type="primary"
                          size="small"
                          class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35] text-xs h-7 px-2 flex items-center"
                          @click.stop="registerForActivity(activity)"
                          :disabled="activity.max_participants && activity.current_participants >= activity.max_participants"
                          :loading="activity.registering"
                        >
                          <UserAddOutlined v-if="!activity.registering" />
                          <span class="hidden sm:inline ml-1">Join</span>
                        </a-button>

                        <a-button
                          v-else
                          size="small"
                          class="!rounded-button bg-gray-500 border-none hover:bg-gray-600 text-white text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center"
                          @click.stop="cancelRegistration(activity)"
                          :loading="activity.cancelling"
                        >
                          <UserDeleteOutlined v-if="!activity.cancelling" />
                        </a-button>

                        <a-button
                          v-if="canCheckin(activity)"
                          type="primary"
                          size="small"
                          class="!rounded-button bg-[#FA8C16] border-none hover:bg-[#D46B08] text-xs h-7 w-7 p-0 flex items-center justify-center"
                          @click.stop="openActivityCheckinModal(activity)"
                        >
                          <CheckCircleOutlined />
                        </a-button>
                      </template>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div class="mt-4 md:mt-6 flex justify-center">
              <a-pagination v-model:current="currentPage" :total="totalPages" size="small" :simple="true" />
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
import CreateGroupModal from '@/components/groups/CreateGroupModal.vue'
import PostThoughtModal from '@/components/groups/PostThoughtModal.vue'
import GroupChatModal from '@/components/groups/GroupChatModal.vue'
import ActivityCheckinModal from '@/components/activities/ActivityCheckinModal.vue'
import ActivityChatModal from '@/components/activities/ActivityChatModal.vue'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

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
const activeRadarDot = ref(null)
const isMapExpanded = ref(false)
const hoveredDot = ref(null)

// Groups related state
const myGroups = ref([])
const allGroups = ref([])
const selectedGroupId = ref(null)
const showCreateGroupModal = ref(false)
const showPostThoughtModal = ref(false)
const showBrowseGroupsModal = ref(false)
const showGroupChatModal = ref(false)
const selectedGroupForChat = ref(null)

// Visibility state
const isVisible = ref(true)

// Thoughts state
const thoughts = ref([])
const mapThoughts = ref([])
const visibleUsers = ref([])

// Activity functionality state
const showCheckinModal = ref(false)
const showParticipantsModal = ref(false)
const showCheckinCodeModal = ref(false)
const selectedActivity = ref(null)
const checkinForm = ref({
  location: null,
  checking: false
})
const participantsList = ref([])

// New checkin modal state
const showActivityCheckinModal = ref(false)
const selectedActivityForCheckin = ref(null)

// Activity chat modal state
const showActivityChatModal = ref(false)
const selectedActivityForChat = ref(null)


// Google Maps instances
let smallMap = null
let largeMap = null
let thoughtMarkers = []
let userMarkers = []

// Filter options
const feedFilters = ['all', 'groups', 'urgent']

// Activities data
const activities = ref([])
const activitiesLoading = ref(false)
const activitiesError = ref(null)
const participatedActivityIds = ref(new Set())

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
    ? `${raw.organizer.first_name || ''} ${raw.organizer.last_name || ''}`.trim()
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
      name: organizerName || raw.organizer?.email || 'Campus Organizer',
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

// Computed properties
const filteredActivities = computed(() => {
  let filtered = [...activities.value]

  if (feedFilter.value === 'groups') {
    filtered = filtered.filter(activity =>
      activity.isOwner || participatedActivityIds.value.has(activity.id)
    )
  } else if (feedFilter.value === 'urgent') {
    const now = Date.now()
    filtered = filtered.filter(activity => {
      if (!activity.start_time) return false
      const startTime = new Date(activity.start_time).getTime()
      return startTime > now && (startTime - now) <= 2 * 60 * 60 * 1000 // within 2 hours
    })
  }

  if (sortOption.value === 'newest') {
    filtered.sort((a, b) => new Date(b.start_time || b.created_at || 0) - new Date(a.start_time || a.created_at || 0))
  } else if (sortOption.value === 'closest') {
    filtered.sort((a, b) => {
      const aTime = new Date(a.start_time || 0).getTime()
      const bTime = new Date(b.start_time || 0).getTime()
      return aTime - bTime
    })
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredActivities.value.length / 10) || 1
})

// Methods
const joinGroup = (group) => {
  alert(`Joined ${group.name}! You'll receive notifications about group activities.`)
}

const highlightRadarDot = (activityId) => {
  activeRadarDot.value = activityId
}

const resetRadarDot = () => {
  activeRadarDot.value = null
}

const toggleMapExpand = () => {
  isMapExpanded.value = !isMapExpanded.value
  if (isMapExpanded.value) {
    // 等待 modal 渲染后初始化大地图
    nextTick(() => {
      initLargeMap()
    })
  }
}

const showDotInfo = (dot) => {
  hoveredDot.value = dot
}

const hideDotInfo = () => {
  hoveredDot.value = null
}

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

// === Groups API Methods ===
const fetchMyGroups = async () => {
  try {
    const response = await groupAPI.getMyGroups()
    myGroups.value = response.data.data.groups || []
  } catch (error) {
    console.error('Failed to fetch my groups:', error)
    message.error('Failed to fetch groups list')
  }
}

const fetchAllGroups = async () => {
  try {
    const response = await groupAPI.getGroups()
    allGroups.value = response.data.data.groups || []
  } catch (error) {
    console.error('Failed to fetch all groups:', error)
  }
}

const joinGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.joinGroup(groupId)
    if (response.data.success) {
      message.success('Group joined successfully!')
      await fetchMyGroups()
      await fetchAllGroups()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Failed to join group')
  }
}

const leaveGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.leaveGroup(groupId)
    if (response.data.success) {
      message.success('Left the group')
      if (selectedGroupId.value === groupId) {
        selectedGroupId.value = null
      }
      await fetchMyGroups()
      await fetchThoughts()
      await fetchMapThoughts()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Failed to leave group')
  }
}

const deleteGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.deleteGroup(groupId)
    if (response.data.success) {
      message.success('Group deleted successfully')
      if (selectedGroupId.value === groupId) {
        selectedGroupId.value = null
      }
      await fetchMyGroups()
      await fetchAllGroups()
      await fetchThoughts()
      await fetchMapThoughts()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Failed to delete group')
  }
}

const enterGroup = (group) => {
  selectedGroupId.value = selectedGroupId.value === group.id ? null : group.id
  fetchThoughts()
  fetchMapThoughts()
}

// Navigate to group detail page
const goToGroupDetail = (groupId) => {
  router.push(`/groups/${groupId}`)
}

const handleGroupCreated = () => {
  fetchMyGroups()
  fetchAllGroups()
  message.success('Group created successfully!')
}

const isGroupJoined = (groupId) => {
  return myGroups.value.some(g => g.id === groupId)
}

// Open group chat modal
const openGroupChat = (group) => {
  selectedGroupForChat.value = group
  showGroupChatModal.value = true
}

// === Thoughts API Methods ===
const fetchThoughts = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await thoughtAPI.getThoughts(params)
    thoughts.value = response.data.data.thoughts || []
  } catch (error) {
    console.error('Failed to fetch thoughts:', error)
  }
}

const fetchMapThoughts = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await thoughtAPI.getMapThoughts(params)
    mapThoughts.value = response.data.data.thoughts || []
    updateMapMarkers()
  } catch (error) {
    console.error('Failed to fetch map thoughts:', error)
  }
}

const handleThoughtPosted = () => {
  fetchThoughts()
  fetchMapThoughts()
  message.success('Activity posted successfully!')
}

// === Visibility API Methods ===
const toggleVisibility = async () => {
  try {
    let location = null
    if (!isVisible.value) {
      // 要变为可见，获取位置
      location = await getCurrentLocation()
    }

    const response = await visibilityAPI.updateVisibility({
      is_visible: !isVisible.value,
      current_location: location
    })

    if (response.data.success) {
      isVisible.value = !isVisible.value
      message.success(isVisible.value ? 'You are now visible on the map' : 'You are now invisible')
      fetchVisibleUsers()
    }
  } catch (error) {
    message.error('Failed to toggle visibility')
  }
}

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser does not support geolocation'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        })
      },
      (error) => {
        let message = 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'User denied the location permission request'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            message = 'Location request timed out'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

const fetchVisibleUsers = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await visibilityAPI.getMapUsers(params)
    visibleUsers.value = response.data.data.users || []
    updateMapMarkers()
  } catch (error) {
    console.error('Failed to fetch visible users:', error)
  }
}

// === Google Maps Methods ===
const initGoogleMaps = async () => {
  try {
    // Wait for Google Maps API to load
    if (!window.google) {
      // If not loaded yet, wait a bit
      await new Promise((resolve) => {
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle)
            resolve()
          }
        }, 100)
      })
    }

    // Initialize small map
    const smallMapElement = document.getElementById('small-map')
    if (smallMapElement && window.google) {
      smallMap = new window.google.maps.Map(smallMapElement, {
        center: { lat: 42.4534, lng: -76.4735 }, // Your University
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false
      })
    }

    updateMapMarkers()
  } catch (error) {
    console.error('Google Maps loading failed:', error)
    message.error('Map loading failed')
  }
}

const initLargeMap = async () => {
  try {
    if (!window.google) return

    const largeMapElement = document.getElementById('large-map')
    if (largeMapElement && !largeMap) {
      largeMap = new window.google.maps.Map(largeMapElement, {
        center: { lat: 42.4534, lng: -76.4735 },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false
      })
      updateLargeMapMarkers()
    }
  } catch (error) {
    console.error('Large map initialization failed:', error)
  }
}

const updateMapMarkers = () => {
  if (!smallMap || !window.google) {
    console.log('⚠️ Map not initialized or Google API not loaded')
    return
  }

  console.log('🗺️ Updating map markers:', {
    thoughts: mapThoughts.value.length,
    users: visibleUsers.value.length
  })

  // Clear old markers
  thoughtMarkers.forEach(marker => marker.setMap(null))
  userMarkers.forEach(marker => marker.setMap(null))
  thoughtMarkers = []
  userMarkers = []

  // Add thought markers (with user avatar)
  mapThoughts.value.forEach(thought => {
    console.log('📍 Adding thought marker:', thought)
    if (thought.location && thought.location.lat && thought.location.lng) {
      // Truncate overly long content
      const maxLength = 100
      const displayContent = thought.content.length > maxLength
        ? thought.content.substring(0, maxLength) + '...'
        : thought.content

      // Create marker with avatar if available
      const avatarUrl = thought.user?.avatar_url
      let markerIcon

      if (avatarUrl) {
        markerIcon = {
          url: avatarUrl,
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 18),
          origin: new window.google.maps.Point(0, 0)
        }
      } else {
        markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 12
        }
      }

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: smallMap,
        title: thought.content,
        icon: markerIcon
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; max-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl || 'https://via.placeholder.com/32?text=U'}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/32?text=U'" />
            <span style="font-weight: bold; color: #333;">${thought.user?.first_name || 'User'}</span>
          </div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${displayContent}</div>
          <div style="margin-top: 8px;">
            <button onclick="window.openMessageChat && window.openMessageChat('${thought.user?.id}')"
                    style="background: #C24D45; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Send Message
            </button>
          </div>
        </div>`
      })

      // Show on mouse hover
      marker.addListener('mouseover', () => {
        infoWindow.open(smallMap, marker)
      })

      // Hide on mouse leave
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      // Click to open chat
      marker.addListener('click', () => {
        if (thought.user?.id) {
          handleUserMessage({ id: thought.user.id, name: thought.user.first_name })
        }
      })

      thoughtMarkers.push(marker)
    }
  })

  // Add user markers (with avatar)
  visibleUsers.value.forEach(user => {
    if (user.current_location && user.current_location.lat && user.current_location.lng) {
      const avatarUrl = user.avatar_url
      let markerIcon

      if (avatarUrl) {
        markerIcon = {
          url: avatarUrl,
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 18),
          origin: new window.google.maps.Point(0, 0)
        }
      } else {
        markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 12
        }
      }

      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: smallMap,
        title: user.first_name,
        icon: markerIcon
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl || 'https://via.placeholder.com/32?text=U'}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/32?text=U'" />
            <span style="font-weight: bold; color: #333;">${user.first_name || 'User'}</span>
          </div>
          <div style="margin-top: 8px;">
            <button onclick="window.openMessageChat && window.openMessageChat('${user.id}')"
                    style="background: #C24D45; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Send Message
            </button>
          </div>
        </div>`
      })

      // Show on mouse hover
      marker.addListener('mouseover', () => {
        infoWindow.open(smallMap, marker)
      })

      // Hide on mouse leave
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      // Click to open chat
      marker.addListener('click', () => {
        if (user.id) {
          handleUserMessage({ id: user.id, name: user.first_name })
        }
      })

      userMarkers.push(marker)
    }
  })
}

const updateLargeMapMarkers = () => {
  if (!largeMap || !window.google) return

  // Copy small map markers to large map with avatars
  mapThoughts.value.forEach(thought => {
    if (thought.location && thought.location.lat && thought.location.lng) {
      // Truncate overly long content
      const maxLength = 100
      const displayContent = thought.content.length > maxLength
        ? thought.content.substring(0, maxLength) + '...'
        : thought.content

      const avatarUrl = thought.user?.avatar_url
      let markerIcon

      if (avatarUrl) {
        markerIcon = {
          url: avatarUrl,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
          origin: new window.google.maps.Point(0, 0)
        }
      } else {
        markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 12
        }
      }

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: largeMap,
        title: thought.content,
        icon: markerIcon
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; max-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl || 'https://via.placeholder.com/32?text=U'}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/32?text=U'" />
            <span style="font-weight: bold; color: #333;">${thought.user?.first_name || 'User'}</span>
          </div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${displayContent}</div>
          <div style="margin-top: 8px;">
            <button onclick="window.openMessageChat && window.openMessageChat('${thought.user?.id}')"
                    style="background: #C24D45; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Send Message
            </button>
          </div>
        </div>`
      })

      marker.addListener('mouseover', () => {
        infoWindow.open(largeMap, marker)
      })

      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      marker.addListener('click', () => {
        if (thought.user?.id) {
          handleUserMessage({ id: thought.user.id, name: thought.user.first_name })
        }
      })
    }
  })

  visibleUsers.value.forEach(user => {
    if (user.current_location && user.current_location.lat && user.current_location.lng) {
      const avatarUrl = user.avatar_url
      let markerIcon

      if (avatarUrl) {
        markerIcon = {
          url: avatarUrl,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
          origin: new window.google.maps.Point(0, 0)
        }
      } else {
        markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 12
        }
      }

      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: largeMap,
        title: user.first_name,
        icon: markerIcon
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl || 'https://via.placeholder.com/32?text=U'}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/32?text=U'" />
            <span style="font-weight: bold; color: #333;">${user.first_name || 'User'}</span>
          </div>
          <div style="margin-top: 8px;">
            <button onclick="window.openMessageChat && window.openMessageChat('${user.id}')"
                    style="background: #C24D45; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Send Message
            </button>
          </div>
        </div>`
      })

      marker.addListener('mouseover', () => {
        infoWindow.open(largeMap, marker)
      })

      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      marker.addListener('click', () => {
        if (user.id) {
          handleUserMessage({ id: user.id, name: user.first_name })
        }
      })
    }
  })
}

// === Activity API Methods ===
const registerForActivity = async (activity) => {
  try {
    activity.registering = true
    const response = await activitiesAPI.joinActivity(activity.id)

    if (response.data?.success) {
      const payload = response.data.data || {}
      activity.isRegistered = true
      activity.current_participants = (activity.current_participants || 0) + 1
      activity.participants = activity.current_participants
      activity.user_participation = payload.participation || null
      activity.user_checked_in = false
      participatedActivityIds.value = new Set([
        ...participatedActivityIds.value,
        activity.id
      ])

      const joinPoints = activity.reward_points || 0
      if (joinPoints > 0) {
        message.success(`Successfully joined "${activity.title}"! You'll earn ${joinPoints} points when you check in.`)
      } else {
        message.success(`Successfully joined "${activity.title}"!`)
      }

      await fetchUserPoints()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Failed to join activity')
  } finally {
    activity.registering = false
  }
}

const cancelRegistration = async (activity) => {
  try {
    activity.cancelling = true
    const response = await activitiesAPI.leaveActivity(activity.id)

    if (response.data?.success) {
      activity.isRegistered = false
      activity.current_participants = Math.max((activity.current_participants || 1) - 1, 0)
      activity.participants = activity.current_participants
      activity.user_participation = null
      activity.user_checked_in = false
      participatedActivityIds.value = new Set(
        [...participatedActivityIds.value].filter(id => id !== activity.id)
      )
      message.success(`Registration cancelled for "${activity.title}"`)
      await fetchUserPoints()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Failed to cancel registration')
  } finally {
    activity.cancelling = false
  }
}

// Enhanced points integration
const awardPointsForActivity = async (action, points, activityTitle) => {
  try {
    const pointsData = {
      action: action,
      points: points,
      description: `${action === 'join' ? 'Joined' : action === 'checkin' ? 'Checked into' : 'Completed'} activity: ${activityTitle}`,
      category: 'activity',
      metadata: {
        activity_title: activityTitle,
        action: action
      }
    }

    const response = await pointsAPI.awardPoints(pointsData)

    if (response.data.success) {
      console.log(`Successfully awarded ${points} points for ${action}`)
      return response.data
    }
  } catch (error) {
    console.error('Failed to award points:', error)
    // Don't show error to user - points failure shouldn't block main action
  }
}

// User points state
const userPoints = ref({
  current_balance: 0,
  total_earned: 0,
  total_spent: 0
})

const fetchUserPoints = async () => {
  try {
    const response = await pointsAPI.getMyPoints()
    if (response.data?.success) {
      const payload = response.data.data || {}
      userPoints.value = {
        current_balance: payload.current_balance ?? payload.points ?? 0,
        total_earned: payload.total_earned ?? payload.points ?? 0,
        total_spent: payload.total_spent ?? 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch user points:', error)
  }
}

const editActivity = (activity) => {
  // Navigate to edit activity page or show edit modal
  message.info('Edit functionality will be implemented in next phase')
}

const showParticipants = async (activity) => {
  try {
    selectedActivity.value = activity

    const response = await activitiesAPI.getActivityParticipants(activity.id)
    if (response.data?.success) {
      const payload = response.data.data || {}
      participantsList.value = (payload.participants || []).map(mapParticipant)
      showParticipantsModal.value = true
    }
  } catch (error) {
    console.error('Failed to load participants list:', error)
    message.error(error.response?.data?.error?.message || 'Failed to load participants list')
  }
}

// Participant mapper
const mapParticipant = (participant) => {
  const fullName = participant.user
    ? `${participant.user.first_name || ''} ${participant.user.last_name || ''}`.trim()
    : ''

  return {
    id: participant.id,
    user_id: participant.user_id,
    name: fullName || participant.user?.email || 'Participant',
    email: participant.user?.email || 'N/A',
    avatar: participant.user?.avatar_url || DEFAULT_ACTIVITY_AVATAR,
    joined_at: participant.registration_time,
    status: participant.attendance_status || 'registered'
  }
}

const legacyGenerateMockParticipants = () => {
  return []
  const mockUsers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20friendly%20smile&width=40&height=40&seq=1&orientation=squarish',
      joined_at: '2025-10-20T10:30:00Z',
      status: 'registered'
    },
    {
      id: 2,
      name: 'Emily Davis',
      email: 'emily.davis@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20glasses&width=40&height=40&seq=2&orientation=squarish',
      joined_at: '2025-10-20T11:15:00Z',
      status: 'checked_in'
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael.j@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20beard&width=40&height=40&seq=3&orientation=squarish',
      joined_at: '2025-10-20T12:00:00Z',
      status: 'registered'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20curly%20hair&width=40&height=40&seq=4&orientation=squarish',
      joined_at: '2025-10-20T13:30:00Z',
      status: 'checked_in'
    },
    {
      id: 5,
      name: 'David Chen',
      email: 'david.chen@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20asian%20male%20student&width=40&height=40&seq=5&orientation=squarish',
      joined_at: '2025-10-20T14:00:00Z',
      status: 'registered'
    },
    {
      id: 6,
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@university.edu',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20latina%20female%20student&width=40&height=40&seq=6&orientation=squarish',
      joined_at: '2025-10-20T14:30:00Z',
      status: 'registered'
    }
  ]

  return mockUsers.slice(0, count).map((user, index) => ({
    ...user,
    // Randomly assign some as checked in for ongoing activities
    status: activityId === 3 && index < 2 ? 'checked_in' : 'registered'
  }))
}

// Remove participant (for activity owners)
const removeParticipant = async (participant) => {
  try {
    // In real implementation:
    // const response = await activitiesAPI.removeParticipant(selectedActivity.value.id, participant.id)

    // Mock implementation:
    participantsList.value = participantsList.value.filter(p => p.id !== participant.id)
    selectedActivity.value.current_participants--

    // Update the activity in the main list
    const activityIndex = activities.value.findIndex(a => a.id === selectedActivity.value.id)
    if (activityIndex !== -1) {
      activities.value[activityIndex].current_participants--
    }

    message.success(`Removed ${participant.name} from the activity`)
  } catch (error) {
    message.error('Failed to remove participant')
  }
}

// Send message to participant
const messageParticipant = (participant) => {
  message.info(`Opening chat with ${participant.name}...`)
  // In real implementation, this would open a chat/messaging interface
}

// Handle user message from ClickableAvatar
const handleUserMessage = (user) => {
  router.push({
    path: '/messages',
    query: { userId: user.id }
  })
}

// Open activity chat modal
const openActivityChat = (activity) => {
  selectedActivityForChat.value = activity
  showActivityChatModal.value = true
}

// Get participant status color
const getParticipantStatusColor = (status) => {
  switch (status) {
    case 'checked_in':
      return 'green'
    case 'registered':
      return 'blue'
    case 'cancelled':
      return 'red'
    default:
      return 'default'
  }
}

// Get participant status text
const getParticipantStatusText = (status) => {
  switch (status) {
    case 'checked_in':
      return 'Checked In'
    case 'registered':
      return 'Registered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

// Format join date
const formatJoinDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateCheckinCode = async (activity) => {
  try {
    const response = await activitiesAPI.generateCheckinCode(activity.id)

    if (response.data?.success) {
      const payload = response.data.data || {}
      activity.checkin_code = payload.checkinCode
      activity.code_expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      activity.status = activity.status === 'published' ? 'ongoing' : activity.status

      selectedActivity.value = activity
      showCheckinCodeModal.value = true
      message.success('Check-in code generated successfully!')

      // Update the activity in the main list
      const activityIndex = activities.value.findIndex(a => a.id === activity.id)
      if (activityIndex !== -1) {
        activities.value[activityIndex].checkin_code = activity.checkin_code
        activities.value[activityIndex].code_expires_at = activity.code_expires_at
        activities.value[activityIndex].status = 'ongoing'
      }
    }
  } catch (error) {
    console.error('Failed to generate check-in code:', error)
    message.error(error.response?.data?.error?.message || 'Failed to generate check-in code')
  }
}

// Check if code is expired
const isCodeExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

// Enhanced code validation
const validateCheckinCode = (inputCode, activity) => {
  if (!inputCode || inputCode.length === 0) {
    return { valid: false, message: 'Please enter a check-in code' }
  }

  if (!activity.checkin_code) {
    return { valid: false, message: 'No check-in code has been generated for this activity' }
  }

  if (inputCode.toUpperCase() !== activity.checkin_code.toUpperCase()) {
    return { valid: false, message: 'Invalid check-in code. Please try again.' }
  }

  if (isCodeExpired(activity.code_expires_at)) {
    return { valid: false, message: 'Check-in code has expired. Please ask the organizer for a new code.' }
  }

  return { valid: true, message: 'Code is valid' }
}

// Format expiration time for display
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
  } else {
    return `Expires in ${minutes}m`
  }
}

const openCheckinModal = (activity) => {
  selectedActivity.value = activity
  checkinForm.value = {
    location: null,
    checking: false
  }
  showCheckinModal.value = true
}

// New check-in methods
const canCheckin = (activity) => {
  // 检查活动状态是否允许Check In（In Progress中）
  if (activity.status !== 'ongoing') return false

  // 检查用户是否已经参加活动
  if (!activity.isRegistered) return false

  // 检查是否已经Check In
  if (activity.user_checked_in) return false
  if (activity.user_participation?.checked_in) return false

  // 检查活动是否启用Check In功能（如果字段存在的话）
  // 如果字段不存在（数据库迁移未执行），则默认允许Check In
  if (activity.checkin_enabled !== undefined && !activity.checkin_enabled) return false

  return true
}

const openActivityCheckinModal = (activity) => {
  selectedActivityForCheckin.value = activity
  showActivityCheckinModal.value = true
}

const handleActivityCheckinSuccess = (data) => {
  // 更新活动状态
  const activity = activities.value.find(a => a.id === data.activityId)
  if (activity && activity.user_participation) {
    activity.user_participation.checked_in = true
    activity.user_participation.checkin_time = data.result.checkinTime
    activity.user_checked_in = true
  }

  message.success('Check In成功！')
  showActivityCheckinModal.value = false

  // 刷新用户积分
  fetchUserPoints()
}

const submitCheckin = async () => {
  try {
    if (!selectedActivity.value) return
    const activity = selectedActivity.value

    checkinForm.value.checking = true

    // 1. 验证Activity Time
    const now = new Date()
    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)

    if (now < startTime) {
      message.error(`活动还未开始。开始时间：${formatDateTime(activity.start_time)}`)
      checkinForm.value.checking = false
      return
    }

    if (now > endTime) {
      message.error('活动已结束，无法Check In')
      checkinForm.value.checking = false
      return
    }

    // 2. 获取当前位置
    message.loading('正在获取您的位置...', 0)
    let currentLocation
    try {
      currentLocation = await getCurrentLocation()
      checkinForm.value.location = currentLocation
      message.destroy()
    } catch (locationError) {
      message.destroy()
      message.error(locationError.message || '获取位置失败，无法完成Check In')
      console.error('Location error:', locationError)
      checkinForm.value.checking = false
      return
    }

    // 3. 验证位置距离
    if (activity.location_verification && activity.locationCoordinates) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        activity.locationCoordinates.lat,
        activity.locationCoordinates.lng
      )

      const maxDistance = activity.max_checkin_distance || 100
      if (distance > maxDistance) {
        message.error(`您距离Activity Location太远了。当前距离：${Math.round(distance)}米，要求距离：${maxDistance}meters of the activity location`)
        checkinForm.value.checking = false
        return
      }
    }

    // 4. 提交Check In
    const payload = {
      location: currentLocation
    }

    const response = await activitiesAPI.checkinActivity(activity.id, payload)

    if (response.data?.success) {
      const data = response.data.data || {}
      activity.user_checked_in = true
      if (activity.user_participation) {
        activity.user_participation.attendance_status = 'attended'
        activity.user_participation.checkin_time = new Date().toISOString()
      } else {
        activity.user_participation = {
          attendance_status: 'attended',
          checkin_time: new Date().toISOString()
        }
      }

      showCheckinModal.value = false
      updateActivityAfterCheckin(activity.id, activity.user_participation)

      const earned = data.pointsEarned ?? activity.reward_points ?? 0
      if (earned > 0) {
        message.success(`Check In成功！您获得了 ${earned} 积分 🎉`)
      } else {
        message.success('Check In成功！')
      }

      await fetchUserPoints()
    }

  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Check In失败')
    console.error('Checkin error:', error)
  } finally {
    checkinForm.value.checking = false
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in meters
}

// Helper function to update activity status after successful checkin
const updateActivityAfterCheckin = (activityId, participation = null) => {
  const activityIndex = activities.value.findIndex(a => a.id === activityId)
  if (activityIndex !== -1) {
    const activity = activities.value[activityIndex]
    activity.user_checked_in = true
    if (participation) {
      activity.user_participation = participation
    }

    if (activity.isOwner && activity.status === 'published') {
      activity.status = 'ongoing'
    }
  }
}

const copyCheckinCode = () => {
  if (selectedActivity.value?.checkin_code) {
    navigator.clipboard.writeText(selectedActivity.value.checkin_code)
      .then(() => {
        message.success('Check-in code copied to clipboard!')
      })
      .catch(() => {
        message.error('Failed to copy check-in code')
      })
  }
}

// Watch for group selection changes
watch(selectedGroupId, () => {
  fetchThoughts()
  fetchMapThoughts()
  fetchVisibleUsers()
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

  // 获取我的可见性状态
  try {
    const response = await visibilityAPI.getMyVisibility()
    isVisible.value = response.data.data.visibility.is_visible
  } catch (error) {
    console.error('获取可见性状态失败:', error)
  }
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
