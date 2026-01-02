<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-4 md:pt-8 pb-8 md:pb-16 max-w-7xl mx-auto px-3 md:px-4">
      <!-- Mobile: Single column with toggle -->
      <div class="lg:hidden mb-4" v-if="selectedThreadId">
        <a-button type="link" @click="closeThread" class="text-[#C24D45] p-0">
          ← Back to conversations
        </a-button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <!-- Message Threads Sidebar - Hidden on mobile when thread selected -->
        <div class="lg:col-span-1" :class="{ 'hidden lg:block': selectedThreadId }">
          <div class="bg-white rounded-lg shadow-sm">
            <div class="p-4 md:p-6 border-b border-gray-200">
              <div class="flex items-center justify-between mb-3 md:mb-4">
                <h2 class="text-lg md:text-xl font-bold text-[#333333] flex items-center">
                  <MessageOutlined class="mr-2 text-[#C24D45]" />
                  Messages
                </h2>
                <!-- Search Messages -->
                <a-input
                  v-model:value="searchQuery"
                  placeholder="Search..."
                  class="w-24 md:w-32"
                  size="small"
                  allow-clear
                >
                  <template #prefix>
                    <SearchOutlined class="text-gray-400" />
                  </template>
                </a-input>
              </div>
              <!-- Chat Type Tabs -->
              <div class="flex border-b border-gray-200">
                <button
                  @click="chatType = 'direct'"
                  class="flex-1 py-2 text-xs md:text-sm font-medium transition-colors"
                  :class="chatType === 'direct'
                    ? 'text-[#C24D45] border-b-2 border-[#C24D45]'
                    : 'text-gray-500 hover:text-gray-700'"
                >
                  <UserOutlined class="mr-1" />
                  Direct ({{ filteredThreads.length }})
                </button>
                <button
                  @click="chatType = 'group'"
                  class="flex-1 py-2 text-xs md:text-sm font-medium transition-colors"
                  :class="chatType === 'group'
                    ? 'text-[#C24D45] border-b-2 border-[#C24D45]'
                    : 'text-gray-500 hover:text-gray-700'"
                >
                  <TeamOutlined class="mr-1" />
                  Groups ({{ myActivities.length + myGroups.length }})
                </button>
              </div>
            </div>

            <!-- Direct Messages List -->
            <div v-if="chatType === 'direct'" class="h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)] overflow-y-auto">
              <div v-if="threadsLoading" class="py-8 md:py-12 flex justify-center">
                <a-spin />
              </div>
              <div v-else-if="threadsError" class="py-8 md:py-12 text-center text-red-500 text-sm">
                {{ threadsError }}
              </div>
              <div v-else>
                <!-- System Messages Thread (Always visible, cannot be deleted) -->
                <div
                  class="p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50 border-blue-200"
                  :class="{ 'bg-blue-100': selectedThreadId === 'system-messages' }"
                  @click="selectSystemMessagesThread"
                >
                  <div class="flex items-start space-x-2 md:space-x-3">
                    <div class="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      📢
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <h3 class="font-medium text-gray-900 truncate text-sm md:text-base">System Messages</h3>
                        <span v-if="systemMessagesUnreadCount > 0" class="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {{ systemMessagesUnreadCount > 99 ? '99+' : systemMessagesUnreadCount }}
                        </span>
                      </div>
                      <p class="text-xs md:text-sm text-gray-600 truncate mt-1">Announcements & Feedback</p>
                      <p class="text-xs text-gray-500 truncate mt-1">{{ systemMessagesPreview }}</p>
                      <div class="flex items-center justify-between mt-1 md:mt-2">
                        <span class="text-xs text-gray-400">{{ formatTimeAgo(lastSystemMessageTime) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Regular direct messages -->
                <div v-if="filteredThreads.length === 0" class="py-8 md:py-12 text-center text-gray-500">
                  <MessageOutlined class="text-3xl md:text-4xl mb-3 md:mb-4" />
                  <p class="text-sm md:text-base">No messages</p>
                  <p class="text-xs md:text-sm text-gray-400 mt-2">Start conversations by participating in activities</p>
                </div>
                <div v-else>
                  <div
                    v-for="thread in filteredThreads"
                    :key="thread.thread_id"
                    class="p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    :class="{ 'bg-blue-50 border-blue-200': selectedThreadId === thread.thread_id }"
                    @click="selectThread(thread)"
                  >
                    <div class="flex items-start space-x-2 md:space-x-3">
                      <!-- Avatar with online indicator -->
                      <div class="relative">
                        <div class="w-10 h-10 md:w-12 md:h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold overflow-hidden text-sm md:text-base">
                          <img
                            v-if="thread.other_user?.avatar_url"
                            :src="thread.other_user.avatar_url"
                            class="w-full h-full object-cover"
                          />
                          <span v-else>{{ getThreadInitial(thread) }}</span>
                        </div>
                        <!-- Online status indicator -->
                        <div
                          v-if="isUserOnline(thread.other_user?.id)"
                          class="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"
                        ></div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <h3 class="font-medium text-gray-900 truncate text-sm md:text-base">
                            {{ getThreadName(thread) }}
                          </h3>
                          <span v-if="thread.unread_count > 0" class="bg-[#C24D45] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {{ thread.unread_count > 99 ? '99+' : thread.unread_count }}
                          </span>
                        </div>
                        <p class="text-xs md:text-sm text-gray-600 truncate mt-1">{{ getThreadSubject(thread) }}</p>
                        <p class="text-xs text-gray-500 truncate mt-1">{{ getThreadPreview(thread) }}</p>
                        <div class="flex items-center justify-between mt-1 md:mt-2">
                          <span class="text-xs text-gray-400">{{ formatTimeAgo(thread.last_message_time) }}</span>
                          <span class="text-xs text-gray-400 hidden sm:inline">{{ thread.message_count }} msgs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Group Chats List -->
            <div v-else class="h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)] overflow-y-auto">
              <div v-if="groupChatsLoading" class="py-8 md:py-12 flex justify-center">
                <a-spin />
              </div>
              <div v-else-if="myActivities.length === 0 && myGroups.length === 0" class="py-8 md:py-12 text-center text-gray-500">
                <TeamOutlined class="text-3xl md:text-4xl mb-3 md:mb-4" />
                <p class="text-sm md:text-base">No group chats</p>
                <p class="text-xs md:text-sm text-gray-400 mt-2">Join activities or groups to start group chatting</p>
              </div>
              <div v-else>
                <!-- My Activities -->
                <div v-if="myActivities.length > 0" class="mb-4">
                  <div class="px-3 md:px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                    Activity Chats
                  </div>
                  <div
                    v-for="activity in myActivities"
                    :key="'activity-' + activity.id"
                    class="p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    @click="openActivityChat(activity)"
                  >
                    <div class="flex items-center space-x-2 md:space-x-3">
                      <div class="w-10 h-10 md:w-12 md:h-12 bg-[#FA8C16] rounded-full flex items-center justify-center text-white">
                        <TeamOutlined class="text-sm md:text-base" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 truncate text-sm md:text-base">{{ activity.title }}</h3>
                        <p class="text-xs md:text-sm text-gray-500 truncate">{{ activity.current_participants || 0 }} participants</p>
                        <div class="flex items-center space-x-2 mt-1">
                          <a-tag color="orange" size="small" class="text-xs">Activity</a-tag>
                          <span class="text-xs text-gray-400">{{ activity.status }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- My Groups -->
                <div v-if="myGroups.length > 0">
                  <div class="px-3 md:px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                    Group Chats
                  </div>
                  <div
                    v-for="group in myGroups"
                    :key="'group-' + group.id"
                    class="p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    @click="openGroupChat(group)"
                  >
                    <div class="flex items-center space-x-2 md:space-x-3">
                      <div class="w-10 h-10 md:w-12 md:h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                        {{ group.name?.charAt(0)?.toUpperCase() || 'G' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 truncate text-sm md:text-base">{{ group.name }}</h3>
                        <p class="text-xs md:text-sm text-gray-500 truncate">{{ group.member_count || 0 }} members</p>
                        <div class="flex items-center space-x-2 mt-1">
                          <a-tag color="red" size="small" class="text-xs">Group</a-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Content Area - Full width on mobile when thread selected -->
        <div class="lg:col-span-2" :class="{ 'hidden lg:block': !selectedThreadId }">
          <div class="bg-white rounded-lg shadow-sm h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
            <!-- New conversation form -->
            <div
              v-if="pendingNewConversationUserId && !selectedThreadId"
              class="h-full flex items-center justify-center px-4 md:px-8"
            >
              <div class="max-w-lg w-full space-y-3 md:space-y-4 text-gray-700">
                <div class="text-center">
                  <MessageOutlined class="text-4xl md:text-5xl text-[#C24D45] mb-3 md:mb-4" />
                  <p class="text-lg md:text-xl font-semibold">Start a conversation</p>
                  <p class="text-xs md:text-sm text-gray-500">
                    {{ pendingUserLoading ? 'Loading user...' : `Send a message to ${pendingUserName}` }}
                  </p>
                </div>
                <a-input
                  v-model:value="newConversationSubject"
                  placeholder="Subject (optional)"
                  :disabled="creatingNewConversation"
                  size="small"
                />
                <a-textarea
                  v-model:value="newConversationMessage"
                  placeholder="Type your first message..."
                  :rows="3"
                  :maxlength="1000"
                  show-count
                  :disabled="creatingNewConversation"
                />
                <div class="flex justify-end space-x-2 md:space-x-3">
                  <a-button size="small" @click="cancelNewConversation" :disabled="creatingNewConversation">
                    Cancel
                  </a-button>
                  <a-button
                    type="primary"
                    size="small"
                    class="bg-[#C24D45] border-none hover:bg-[#A93C35]"
                    :loading="creatingNewConversation"
                    :disabled="!newConversationMessage.trim() || creatingNewConversation"
                    @click="startNewConversation"
                  >
                    Send
                  </a-button>
                </div>
              </div>
            </div>

            <!-- No thread selected -->
            <div v-else-if="!selectedThreadId" class="h-full flex items-center justify-center text-gray-500">
              <div class="text-center px-4">
                <MessageOutlined class="text-5xl md:text-6xl mb-3 md:mb-4" />
                <p class="text-base md:text-lg">Select a conversation to start chatting</p>
              </div>
            </div>

            <!-- Thread selected -->
            <div v-else class="h-full flex flex-col">
              <!-- Thread header -->
              <div class="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 md:space-x-3">
                    <!-- Avatar with online status -->
                    <div class="relative">
                      <!-- System Messages Avatar -->
                      <div v-if="selectedThreadId === 'system-messages'" class="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg">
                        📢
                      </div>
                      <!-- Regular User Avatar -->
                      <div v-else class="w-8 h-8 md:w-10 md:h-10 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold overflow-hidden text-xs md:text-base">
                        <img
                          v-if="selectedThread?.other_user?.avatar_url"
                          :src="selectedThread.other_user.avatar_url"
                          class="w-full h-full object-cover"
                        />
                        <span v-else>{{ selectedThread ? getThreadInitial(selectedThread) : '' }}</span>
                      </div>
                      <div
                        v-if="!isSystemMessagesThread && isUserOnline(selectedThread?.other_user?.id)"
                        class="absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 border-2 border-white rounded-full"
                      ></div>
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-medium text-gray-900 text-sm md:text-base truncate">
                        {{ getThreadName(selectedThread) }}
                      </h3>
                      <p class="text-xs md:text-sm text-gray-600 truncate">
                        <span v-if="isSystemMessagesThread">Announcements</span>
                        <span v-else>
                          {{ isUserOnline(selectedThread?.other_user?.id) ? 'Online' : 'Offline' }}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-1 md:space-x-2">
                    <!-- Block User Dropdown (hide for system messages) -->
                    <a-dropdown v-if="!isSystemMessagesThread" :trigger="['click']">
                      <a-button type="text" size="small" class="text-gray-400 hover:text-gray-600">
                        <EllipsisOutlined />
                      </a-button>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item
                            v-if="!isCurrentUserBlocked"
                            key="block"
                            @click="showBlockConfirm"
                            class="text-red-500"
                          >
                            <StopOutlined class="mr-2" />
                            Block User
                          </a-menu-item>
                          <a-menu-item
                            v-else
                            key="unblock"
                            @click="unblockCurrentUser"
                          >
                            <CheckCircleOutlined class="mr-2" />
                            Unblock User
                          </a-menu-item>
                          <a-menu-divider />
                          <a-menu-item key="profile" @click="viewUserProfile">
                            <UserOutlined class="mr-2" />
                            View Profile
                          </a-menu-item>
                        </a-menu>
                      </template>
                    </a-dropdown>
                    <a-button type="text" size="small" @click="closeThread" class="text-gray-400 hover:text-gray-600 hidden lg:inline-flex">
                      <CloseOutlined />
                    </a-button>
                  </div>
                </div>
                <!-- Blocked banner (hide for system messages) -->
                <div
                  v-if="isMessagingBlocked && !isSystemMessagesThread"
                  class="mt-2 md:mt-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg text-xs md:text-sm"
                >
                  <div class="flex items-center text-red-700">
                    <StopOutlined class="mr-2" />
                    <span v-if="blockedByMe">You have blocked this user.</span>
                    <span v-else>This user has blocked you.</span>
                  </div>
                </div>
              </div>

              <!-- Messages area -->
              <div class="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4" ref="messagesContainer">
                <div v-if="messageStore.messagesLoading[selectedThreadId]" class="py-8 md:py-12 flex justify-center">
                  <a-spin />
                </div>
                <div v-else-if="messagesError" class="py-8 md:py-12 text-center text-red-500 text-sm">
                  {{ messagesError }}
                </div>
                <div v-else-if="currentThreadMessages.length === 0" class="py-8 md:py-12 text-center text-gray-500 text-sm">
                  <p>This is the beginning of your conversation</p>
                </div>
                <div v-else>
                  <!-- Messages with date grouping -->
                  <template v-for="(group, dateKey) in groupedMessages" :key="dateKey">
                    <!-- Date separator -->
                    <div class="flex items-center justify-center my-3 md:my-4">
                      <div class="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {{ dateKey }}
                      </div>
                    </div>
                    <!-- Messages in this date group -->
                    <div
                      v-for="message in group"
                      :key="message.id"
                      class="flex mb-2 md:mb-3"
                      :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
                    >
                      <!-- Other user's avatar (left side) -->
                      <div v-if="message.sender_id !== currentUserId" class="flex-shrink-0 mr-2">
                        <div v-if="isSystemMessagesThread" class="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm">
                          📢
                        </div>
                        <div v-else class="w-6 h-6 md:w-8 md:h-8 bg-[#C24D45] rounded-full flex items-center justify-center text-white text-xs md:text-sm overflow-hidden">
                          <img
                            v-if="selectedThread?.other_user?.avatar_url"
                            :src="selectedThread.other_user.avatar_url"
                            class="w-full h-full object-cover"
                          />
                          <span v-else>{{ getThreadInitial(selectedThread) }}</span>
                        </div>
                      </div>
                      <!-- Message bubble -->
                      <div
                        class="max-w-[80%] md:max-w-[70%] p-2 md:p-3 rounded-lg relative group"
                        :class="message.sender_id === currentUserId
                          ? 'bg-[#C24D45] text-white'
                          : 'bg-gray-200 text-gray-900'"
                      >
                        <div class="text-xs md:text-sm font-medium mb-1" v-if="message.sender_id !== currentUserId">
                          {{ message.sender_first_name }} {{ message.sender_last_name }}
                        </div>
                        <!-- Message content -->
                        <div class="text-sm md:text-base mb-1 md:mb-2 whitespace-pre-wrap">{{ message.content }}</div>
                        <!-- Time and read status -->
                        <div class="flex items-center justify-end space-x-1">
                          <span
                            class="text-xs opacity-75"
                            :class="message.sender_id === currentUserId ? 'text-white' : 'text-gray-500'"
                          >
                            {{ formatMessageTime(message.created_at) }}
                          </span>
                          <!-- Read receipts (double check) -->
                          <span v-if="message.sender_id === currentUserId" class="text-xs">
                            <CheckOutlined v-if="!message.is_read" class="text-white/70" />
                            <span v-else class="text-white">
                              <CheckOutlined /><CheckOutlined class="-ml-1" />
                            </span>
                          </span>
                        </div>
                        <!-- Emoji reaction button (on hover) - hide for system messages and on mobile -->
                        <div
                          v-if="!isSystemMessagesThread"
                          class="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                        >
                          <a-dropdown :trigger="['click']">
                            <button class="bg-white shadow rounded-full p-1 text-gray-500 hover:text-gray-700">
                              <SmileOutlined class="text-sm" />
                            </button>
                            <template #overlay>
                              <div class="bg-white shadow-lg rounded-lg p-2 flex space-x-1">
                                <button
                                  v-for="emoji in ['👍', '❤️', '😂', '😮', '😢', '🎉']"
                                  :key="emoji"
                                  @click="addReaction(message.id, emoji)"
                                  class="text-xl hover:bg-gray-100 rounded p-1"
                                >
                                  {{ emoji }}
                                </button>
                              </div>
                            </template>
                          </a-dropdown>
                        </div>
                        <!-- Display reactions -->
                        <div v-if="message.reactions && message.reactions.length > 0" class="flex flex-wrap gap-1 mt-1 md:mt-2">
                          <span
                            v-for="(reaction, idx) in message.reactions"
                            :key="idx"
                            class="bg-white/20 rounded-full px-1.5 md:px-2 py-0.5 text-xs"
                          >
                            {{ reaction.emoji }} {{ reaction.count > 1 ? reaction.count : '' }}
                          </span>
                        </div>
                      </div>
                      <!-- My avatar (right side) -->
                      <div v-if="message.sender_id === currentUserId" class="flex-shrink-0 ml-2">
                        <div class="w-6 h-6 md:w-8 md:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs md:text-sm overflow-hidden">
                          <img
                            v-if="currentUserAvatar"
                            :src="currentUserAvatar"
                            class="w-full h-full object-cover"
                          />
                          <span v-else>{{ currentUserInitial }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
                <!-- Typing indicator -->
                <div v-if="otherUserTyping" class="flex items-center space-x-2 text-gray-500 text-xs md:text-sm">
                  <div class="flex space-x-1">
                    <div class="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                  <span class="truncate">{{ getThreadName(selectedThread) }} is typing...</span>
                </div>
              </div>

              <!-- Reply input -->
              <div class="p-3 md:p-4 border-t border-gray-200">
                <!-- Awaiting reply banner (hide for system messages) -->
                <div
                  v-if="replyStatus.awaiting_reply && !isMessagingBlocked && !isSystemMessagesThread"
                  class="mb-2 md:mb-3 p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs md:text-sm"
                >
                  <div class="flex items-center text-yellow-700">
                    <ClockCircleOutlined class="mr-2 flex-shrink-0" />
                    <span class="truncate">Waiting for {{ getThreadName(selectedThread) }} to reply.</span>
                  </div>
                </div>
                <div class="flex space-x-2 md:space-x-3 items-end">
                  <!-- Emoji picker button - hidden on mobile -->
                  <a-dropdown :trigger="['click']" class="hidden md:block">
                    <a-button type="text" class="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <SmileOutlined class="text-lg" />
                    </a-button>
                    <template #overlay>
                      <div class="bg-white shadow-lg rounded-lg p-3 grid grid-cols-8 gap-1">
                        <button
                          v-for="emoji in commonEmojis"
                          :key="emoji"
                          @click="insertEmoji(emoji)"
                          class="text-xl hover:bg-gray-100 rounded p-1"
                        >
                          {{ emoji }}
                        </button>
                      </div>
                    </template>
                  </a-dropdown>
                  <a-textarea
                    v-model:value="replyMessage"
                    placeholder="Type your reply..."
                    :rows="1"
                    :maxlength="1000"
                    :auto-size="{ minRows: 1, maxRows: 3 }"
                    @keydown.enter.exact="handleEnterKey"
                    @input="handleTyping"
                    class="flex-1 text-sm md:text-base"
                  />
                  <a-button
                    type="primary"
                    size="small"
                    :loading="sendingReply"
                    :disabled="!replyMessage.trim() || (replyStatus.awaiting_reply && !isSystemMessagesThread) || (isMessagingBlocked && !isSystemMessagesThread)"
                    @click="sendReply"
                    class="bg-[#C24D45] border-none hover:bg-[#A93C35] flex-shrink-0"
                  >
                    <SendOutlined />
                  </a-button>
                </div>
                <div class="text-xs text-gray-500 mt-1 md:mt-2 hidden md:block">
                  Press Ctrl+Enter or Cmd+Enter to send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New message notification sound -->
    <audio ref="notificationSound" preload="auto">
      <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAI0NZbS4bh7Ej4hlMzhtIgzFRlAkczhtIg9GRVAkMngs4o/GBVAj8fesIs/FxVBjsbcsI1AFhVCjcXasI9BFRVD" type="audio/wav" />
    </audio>

    <!-- Activity Chat Modal -->
    <ActivityChatModal
      v-model:visible="showActivityChatModal"
      :activity="selectedActivity"
      @close="showActivityChatModal = false; selectedActivity = null"
    />

    <!-- Group Chat Modal -->
    <GroupChatModal
      v-model:visible="showGroupChatModal"
      :group="selectedGroup"
      @close="showGroupChatModal = false; selectedGroup = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined,
  EllipsisOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SearchOutlined,
  CheckOutlined,
  SmileOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useMessageStore } from '@/stores/message'
import { io } from 'socket.io-client'
import { messagesAPI, userProfileAPI, activitiesAPI, groupAPI } from '@/utils/api'
import ActivityChatModal from '@/components/activities/ActivityChatModal.vue'
import GroupChatModal from '@/components/groups/GroupChatModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const messageStore = useMessageStore()

// Get current user ID from auth store or localStorage
const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)
const currentUserAvatar = computed(() => storedUser.value?.avatar_url || authStore.user?.avatar_url || null)
const currentUserInitial = computed(() => {
  const user = storedUser.value || authStore.user
  if (user?.first_name) return user.first_name.charAt(0).toUpperCase()
  return 'U'
})

// Blocking state
const isCurrentUserBlocked = ref(false)
const isMessagingBlocked = ref(false)
const blockedByMe = ref(false)
const blockingLoading = ref(false)

// Local reactive data
const replyMessage = ref('')
const sendingReply = ref(false)
const messagesContainer = ref(null)
const socket = ref(null)
const pendingNewConversationUserId = ref(null)
const pendingUserProfile = ref(null)
const pendingUserLoading = ref(false)
const newConversationSubject = ref('')
const newConversationMessage = ref('')
const creatingNewConversation = ref(false)

// New features state
const searchQuery = ref('')
const onlineUsers = ref(new Set())
const otherUserTyping = ref(false)
const typingTimeout = ref(null)
const notificationSound = ref(null)

// Reply status tracking
const replyStatus = ref({
  can_send: true,
  awaiting_reply: false,
  conversation_unlocked: false
})

// Common emojis for picker
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
  '🎉', '🎊', '🎁', '🎈', '✨', '💫', '⭐', '🌟'
]

// Chat type: 'direct' for 1-on-1, 'group' for activity/group chats
const chatType = ref('direct')
const myActivities = ref([])
const myGroups = ref([])
const groupChatsLoading = ref(false)

// System messages state
const systemMessagesUnreadCount = ref(0)
const systemMessagesPreview = ref('No messages yet')
const lastSystemMessageTime = ref(new Date())
const systemMessages = ref([])

// Modal state for group chats
const showActivityChatModal = ref(false)
const showGroupChatModal = ref(false)
const selectedActivity = ref(null)
const selectedGroup = ref(null)

// Store getters
const messageThreads = computed(() => messageStore.messageThreads)
const currentThreadMessages = computed(() => messageStore.currentThreadMessages)
const selectedThread = computed(() => messageStore.selectedThread)
const selectedThreadId = computed(() => messageStore.selectedThreadId)
const threadsLoading = computed(() => messageStore.threadsLoading)
const threadsTotalCount = computed(() => messageStore.messageThreads.length)

// Check if current thread is system messages
const isSystemMessagesThread = computed(() => selectedThreadId.value === 'system-messages')

// Filtered threads based on search
const filteredThreads = computed(() => {
  if (!searchQuery.value.trim()) return messageThreads.value
  const query = searchQuery.value.toLowerCase()
  return messageThreads.value.filter(thread => {
    const name = getThreadName(thread).toLowerCase()
    const subject = getThreadSubject(thread).toLowerCase()
    const preview = getThreadPreview(thread).toLowerCase()
    return name.includes(query) || subject.includes(query) || preview.includes(query)
  })
})

// Group messages by date
const groupedMessages = computed(() => {
  const groups = {}
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  currentThreadMessages.value.forEach(msg => {
    const date = new Date(msg.created_at)
    let dateKey

    if (isSameDay(date, today)) {
      dateKey = 'Today'
    } else if (isSameDay(date, yesterday)) {
      dateKey = 'Yesterday'
    } else {
      dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(msg)
  })

  return groups
})

// Helper to check if two dates are the same day
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

// Check if user is online
const isUserOnline = (userId) => {
  if (!userId) return false
  return onlineUsers.value.has(String(userId))
}

// Error states (local to component)
const threadsError = ref(null)
const messagesError = ref(null)

// Socket.IO connection
const initializeSocket = () => {
  if (!currentUserId.value) return

  try {
    socket.value = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('userToken') || authStore.token
      },
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('✅ Socket connected')
      messageStore.setSocketConnected(true)

      // Join current thread room if selected
      if (selectedThreadId.value) {
        socket.value.emit('join_message_thread', selectedThreadId.value)
      }
    })

    socket.value.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      messageStore.setSocketConnected(false)
    })

    socket.value.on('new_message', (newMessage) => {
      console.log('📩 New message received:', newMessage)
      messageStore.addNewMessage(newMessage)

      // Play notification sound if not current thread or from other user
      if (newMessage.sender_id !== currentUserId.value) {
        playNotificationSound()
      }

      // Scroll to bottom if it's for current thread
      if (newMessage.thread_id === selectedThreadId.value) {
        nextTick(() => scrollToBottom())
      }

      // Show notification if not current thread
      if (newMessage.thread_id !== selectedThreadId.value && newMessage.sender_id !== currentUserId.value) {
        message.info(`New message: ${newMessage.content.substring(0, 50)}...`)
      }
    })

    // Listen for typing indicator
    socket.value.on('typing_indicator', ({ userId, isTyping }) => {
      const otherUserId = selectedThread.value?.other_user?.id
      if (userId === otherUserId) {
        otherUserTyping.value = isTyping
        // Auto-hide typing after 3 seconds
        if (isTyping) {
          setTimeout(() => {
            otherUserTyping.value = false
          }, 3000)
        }
      }
    })

    // Listen for online users update
    socket.value.on('online_users', (users) => {
      onlineUsers.value = new Set(users.map(String))
    })

    // Listen for user online/offline events
    socket.value.on('user_online', (userId) => {
      onlineUsers.value.add(String(userId))
    })

    socket.value.on('user_offline', (userId) => {
      onlineUsers.value.delete(String(userId))
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      messageStore.setSocketConnected(false)
    })

  } catch (error) {
    console.error('Failed to initialize socket:', error)
  }
}

// Cleanup socket
const cleanupSocket = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

// Play notification sound
const playNotificationSound = () => {
  if (notificationSound.value) {
    notificationSound.value.currentTime = 0
    notificationSound.value.play().catch(() => {
      // Ignore autoplay errors
    })
  }
}

// Handle typing - send typing indicator
const handleTyping = () => {
  if (!socket.value || !selectedThreadId.value) return

  // Send typing indicator
  socket.value.emit('typing', {
    threadId: selectedThreadId.value,
    userId: currentUserId.value,
    isTyping: true
  })

  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // Stop typing indicator after 2 seconds of no typing
  typingTimeout.value = setTimeout(() => {
    socket.value?.emit('typing', {
      threadId: selectedThreadId.value,
      userId: currentUserId.value,
      isTyping: false
    })
  }, 2000)
}

// Insert emoji into message
const insertEmoji = (emoji) => {
  replyMessage.value += emoji
}

// Add reaction to message
const addReaction = async (messageId, emoji) => {
  try {
    const response = await messagesAPI.addReaction(messageId, emoji)
    if (response.data?.success) {
      // Update the message's reactions in the local state
      const threadId = selectedThreadId.value
      if (threadMessages.value[threadId]) {
        const msgIndex = threadMessages.value[threadId].findIndex(m => m.id === messageId)
        if (msgIndex >= 0) {
          threadMessages.value[threadId][msgIndex].reactions = response.data.data.reactions
        }
      }
      message.success('Reaction added!')
    }
  } catch (error) {
    console.error('Failed to add reaction:', error)
    message.error(error.response?.data?.error?.message || 'Failed to add reaction')
  }
}

// Get reactions from store
const threadMessages = computed(() => messageStore.threadMessages)

// Methods
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now'
  const now = new Date()
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks}w ago`
}

const formatMessageTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitial = (firstName, lastName) => {
  if (firstName) return firstName.charAt(0).toUpperCase()
  if (lastName) return lastName.charAt(0).toUpperCase()
  return 'U'
}

const getThreadName = (thread) => {
  if (!thread) return 'Unknown user'

  const otherUser = thread.other_user
  if (otherUser) {
    const firstName = otherUser.first_name || ''
    const lastName = otherUser.last_name || ''
    const name = `${firstName} ${lastName}`.trim()
    if (name) return name
  }

  const fallbackFirst = thread.organizer_first_name || thread.sender_first_name || ''
  const fallbackLast = thread.organizer_last_name || thread.sender_last_name || ''
  const fallbackName = `${fallbackFirst} ${fallbackLast}`.trim()
  if (fallbackName) return fallbackName

  return 'Unknown user'
}

const getThreadInitial = (thread) => {
  if (!thread) return 'U'
  const otherUser = thread.other_user
  if (otherUser) {
    return getInitial(otherUser.first_name, otherUser.last_name)
  }
  return getInitial(
    thread.organizer_first_name || thread.sender_first_name,
    thread.organizer_last_name || thread.sender_last_name
  )
}

const getThreadSubject = (thread) => {
  if (!thread) return ''
  return thread.subject || thread.activity_title || ''
}

const getThreadPreview = (thread) => {
  if (!thread) return 'No recent messages'
  return thread.last_message || thread.activity_title || thread.subject || 'No recent messages'
}

// Select a thread
const selectThread = async (thread) => {
  try {
    // Leave previous thread room
    if (selectedThreadId.value && socket.value) {
      socket.value.emit('leave_message_thread', selectedThreadId.value)
    }

    // Select new thread
    messageStore.selectThread(thread)
    messageStore.persistSelectedThread()

    // Join new thread room
    if (socket.value) {
      socket.value.emit('join_message_thread', thread.thread_id)
    }

    // Clear any previous errors
    messagesError.value = null
    otherUserTyping.value = false

    // Check reply status for this thread
    await checkReplyStatus(thread.thread_id)

    // Scroll to bottom after messages load
    nextTick(() => scrollToBottom())
  } catch (error) {
    console.error('Failed to select thread:', error)
    messagesError.value = error.response?.data?.error?.message || 'Failed to load messages'
  }
}

// Close thread
const closeThread = () => {
  if (selectedThreadId.value && socket.value) {
    socket.value.emit('leave_message_thread', selectedThreadId.value)
  }

  messageStore.closeThread()
  messageStore.persistSelectedThread()
  messagesError.value = null
  otherUserTyping.value = false
  resetNewConversationState()
}

// System Messages Thread Handler
const selectSystemMessagesThread = async () => {
  // Set loading state
  messageStore.setMessagesLoading('system-messages', true)

  try {
    // Always reload system messages when selecting the thread
    await loadSystemMessages()

    // Use the store action to set system messages
    messageStore.selectSystemMessages(systemMessages.value)
  } catch (error) {
    console.error('Failed to load system messages:', error)
    // Still select with empty messages on error
    messageStore.selectSystemMessages([])
  } finally {
    messageStore.setMessagesLoading('system-messages', false)
  }

  systemMessagesUnreadCount.value = 0

  // Mark system messages as read
  await messagesAPI.markSystemMessagesAsRead().catch(() => {})

  // Scroll to bottom after messages load
  nextTick(() => scrollToBottom())
}

// Load system messages from backend API
const loadSystemMessages = async () => {
  try {
    const response = await messagesAPI.getSystemMessages({ limit: 100 })
    if (response.data?.success) {
      systemMessages.value = response.data.data.messages || []

      // Update preview and last message time
      if (systemMessages.value.length > 0) {
        const lastMessage = systemMessages.value[systemMessages.value.length - 1]
        const preview = lastMessage.content || ''
        systemMessagesPreview.value = preview.length > 50 ? preview.substring(0, 50) + '...' : preview
        lastSystemMessageTime.value = new Date(lastMessage.created_at)

        // Count unread messages
        systemMessagesUnreadCount.value = systemMessages.value.filter(m => !m.is_read).length
      } else {
        systemMessagesPreview.value = 'No messages yet'
        systemMessagesUnreadCount.value = 0
      }
    }
  } catch (error) {
    console.error('Failed to load system messages:', error)
    // Fallback to empty state
    systemMessages.value = []
    systemMessagesPreview.value = 'No messages yet'
    systemMessagesUnreadCount.value = 0
  }
}

// Handle Enter key events
const handleEnterKey = (event) => {
  // Only send on Ctrl+Enter or Cmd+Enter
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    sendReply()
  }
}

// Send reply
const sendReply = async () => {
  if (!replyMessage.value.trim() || !selectedThreadId.value) return

  try {
    sendingReply.value = true

    // Handle system messages separately - send to backend API
    if (selectedThreadId.value === 'system-messages') {
      const response = await messagesAPI.sendSystemMessage({
        content: replyMessage.value.trim(),
        message_type: 'feedback' // Users send feedback, admins send announcements
      })

      if (response.data?.success) {
        // Add the new message to local array
        const newMessage = response.data.data
        systemMessages.value.push(newMessage)
        // Update store's threadMessages to trigger reactivity
        messageStore.threadMessages['system-messages'] = [...systemMessages.value]
      }
    } else {
      // Regular message sending
      await messageStore.sendReply(selectedThreadId.value, replyMessage.value.trim())
    }

    // Clear the input
    replyMessage.value = ''

    // Scroll to bottom
    await nextTick()
    scrollToBottom()

    message.success('Message sent')
  } catch (error) {
    console.error('Failed to send reply:', error)
    message.error(error.response?.data?.error?.message || 'Failed to send message')
  } finally {
    sendingReply.value = false
  }
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for thread changes to scroll to bottom
watch(currentThreadMessages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

const userQueryHandled = ref(false)

const resetNewConversationState = () => {
  pendingNewConversationUserId.value = null
  pendingUserProfile.value = null
  pendingUserLoading.value = false
  newConversationSubject.value = ''
  newConversationMessage.value = ''
}

const pendingUserName = computed(() => {
  const profile = pendingUserProfile.value
  if (!profile) return 'this user'
  const firstName = profile.first_name || ''
  const lastName = profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || profile.nickname || profile.email || 'this user'
})

const lastRouteIdentifier = ref(null)

const getRouteIdentifier = (query) => {
  if (!query) return null
  return query.userId || query.userEmail || null
}

const loadPendingUserProfile = async (userId) => {
  if (!userId) {
    pendingUserProfile.value = null
    return
  }

  pendingUserLoading.value = true
  try {
    const response = await userProfileAPI.getUserProfile(userId)
    pendingUserProfile.value = response.data?.data || response.data || null
  } catch (error) {
    console.error('Failed to load user profile:', error)
    pendingUserProfile.value = null
  } finally {
    pendingUserLoading.value = false
  }
}

const prepareNewConversation = async (userId) => {
  pendingNewConversationUserId.value = String(userId)
  if (!newConversationSubject.value) {
    newConversationSubject.value = 'New conversation'
  }
  await loadPendingUserProfile(userId)
}

const prepareNewConversationByEmail = async (userEmail) => {
  console.log('📧 Preparing new conversation with email:', userEmail)
  pendingNewConversationUserId.value = userEmail
  if (!newConversationSubject.value) {
    newConversationSubject.value = 'New conversation'
  }

  pendingUserProfile.value = {
    email: userEmail,
    first_name: userEmail.split('@')[0].split('.')[0] || 'User',
    last_name: userEmail.split('@')[0].split('.')[1] || '',
  }
  pendingUserLoading.value = false
}

const handleQueryThreadSelection = async () => {
  const targetUserId = route.query.userId
  const targetUserEmail = route.query.userEmail
  const targetIdentifier = targetUserId || targetUserEmail

  if (!targetIdentifier || userQueryHandled.value) return
  if (threadsLoading.value) return

  try {
    const threads = messageThreads.value || []

    const existingThread = threads.find(thread => {
      const otherUser = thread.other_user
      const otherId = otherUser?.id || thread.receiver_id || thread.sender_id
      const idMatch = otherId && String(otherId) === String(targetIdentifier)
      const otherEmail = otherUser?.email
      const emailMatch = otherEmail && String(otherEmail) === String(targetIdentifier)
      return idMatch || emailMatch
    })

    if (existingThread) {
      resetNewConversationState()
      selectThread(existingThread)
      userQueryHandled.value = true
      return
    }

    if (targetUserEmail && targetUserEmail.includes('@')) {
      await prepareNewConversationByEmail(targetUserEmail)
    } else {
      await prepareNewConversation(targetIdentifier)
    }

    userQueryHandled.value = true
  } catch (error) {
    console.error('Failed while handling query thread selection:', error)
  }
}

const startNewConversation = async () => {
  if (!pendingNewConversationUserId.value || !newConversationMessage.value.trim()) return

  try {
    creatingNewConversation.value = true

    let receiverIdentifier = pendingNewConversationUserId.value
    const isEmail = receiverIdentifier.includes('@')

    const payload = {
      [isEmail ? 'receiver_email' : 'receiver_id']: receiverIdentifier,
      subject: newConversationSubject.value.trim() || 'New conversation',
      content: newConversationMessage.value.trim(),
      message_type: 'general',
      context_type: 'general'
    }

    await messagesAPI.sendMessage(payload)
    message.success('Conversation started')
    newConversationMessage.value = ''

    await messageStore.loadMessageThreads(true)
    userQueryHandled.value = false
    await handleQueryThreadSelection()
  } catch (error) {
    console.error('Failed to start new conversation:', error)
    message.error(error.response?.data?.error?.message || 'Failed to send message')
  } finally {
    creatingNewConversation.value = false
  }
}

const cancelNewConversation = () => {
  resetNewConversationState()
  userQueryHandled.value = true

  const newQuery = { ...route.query }
  delete newQuery.userId
  delete newQuery.userEmail
  router.replace({ query: newQuery }).catch(() => {})
}

// =========================
// User Blocking Methods
// =========================

const getOtherUserId = () => {
  if (!selectedThread.value) return null
  const otherUser = selectedThread.value.other_user
  return otherUser?.id || null
}

// Check reply status for a thread
const checkReplyStatus = async (threadId) => {
  if (!threadId) {
    replyStatus.value = { can_send: true, awaiting_reply: false, conversation_unlocked: false }
    return
  }

  try {
    const response = await messagesAPI.checkReplyStatus(threadId)
    if (response.data?.success) {
      replyStatus.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to check reply status:', error)
    // Default to allowing send
    replyStatus.value = { can_send: true, awaiting_reply: false, conversation_unlocked: false }
  }
}

const checkBlockStatus = async () => {
  // Skip block status check for system messages
  if (isSystemMessagesThread.value) {
    isCurrentUserBlocked.value = false
    isMessagingBlocked.value = false
    blockedByMe.value = false
    return
  }

  const otherUserId = getOtherUserId()
  if (!otherUserId) {
    isCurrentUserBlocked.value = false
    isMessagingBlocked.value = false
    blockedByMe.value = false
    return
  }

  try {
    const response = await messagesAPI.checkBlockStatus(otherUserId)
    if (response.data.success) {
      isCurrentUserBlocked.value = response.data.data.is_blocked_by_me
      isMessagingBlocked.value = response.data.data.messaging_blocked
      blockedByMe.value = response.data.data.blocked_by === 'self'
    }
  } catch (error) {
    console.error('Failed to check block status:', error)
    isCurrentUserBlocked.value = false
    isMessagingBlocked.value = false
    blockedByMe.value = false
  }
}

const showBlockConfirm = () => {
  const otherUserName = getThreadName(selectedThread.value)

  Modal.confirm({
    title: 'Block User',
    content: `Are you sure you want to block ${otherUserName}? You will no longer receive messages from this user.`,
    okText: 'Block',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: blockCurrentUser
  })
}

const blockCurrentUser = async () => {
  const otherUserId = getOtherUserId()
  if (!otherUserId) {
    message.error('Unable to identify user')
    return
  }

  try {
    blockingLoading.value = true
    const response = await messagesAPI.blockUser(otherUserId)

    if (response.data.success) {
      message.success('User blocked successfully')
      isCurrentUserBlocked.value = true
      isMessagingBlocked.value = true
      blockedByMe.value = true
    }
  } catch (error) {
    console.error('Failed to block user:', error)
    message.error(error.response?.data?.error?.message || 'Failed to block user')
  } finally {
    blockingLoading.value = false
  }
}

const unblockCurrentUser = async () => {
  const otherUserId = getOtherUserId()
  if (!otherUserId) {
    message.error('Unable to identify user')
    return
  }

  try {
    blockingLoading.value = true
    const response = await messagesAPI.unblockUser(otherUserId)

    if (response.data.success) {
      message.success('User unblocked successfully')
      isCurrentUserBlocked.value = false
      isMessagingBlocked.value = false
      blockedByMe.value = false
    }
  } catch (error) {
    console.error('Failed to unblock user:', error)
    message.error(error.response?.data?.error?.message || 'Failed to unblock user')
  } finally {
    blockingLoading.value = false
  }
}

const viewUserProfile = () => {
  const otherUserId = getOtherUserId()
  if (otherUserId) {
    router.push(`/profile/${otherUserId}`)
  }
}

// Load my activities and groups for group chats
const loadGroupChats = async () => {
  try {
    groupChatsLoading.value = true

    // Load activities I'm participating in
    const activitiesResponse = await activitiesAPI.getMyActivities({ type: 'registered' })
    const activitiesData = activitiesResponse.data?.data?.activities || []
    myActivities.value = activitiesData.filter(a => a.status !== 'completed' && a.status !== 'cancelled')

    // Load my groups
    const groupsResponse = await groupAPI.getMyGroups()
    myGroups.value = groupsResponse.data?.data?.groups || []
  } catch (error) {
    console.error('Failed to load group chats:', error)
  } finally {
    groupChatsLoading.value = false
  }
}

// Navigate to activity chat - open modal directly
const openActivityChat = (activity) => {
  selectedActivity.value = activity
  showActivityChatModal.value = true
}

// Navigate to group chat - open modal directly
const openGroupChat = (group) => {
  selectedGroup.value = group
  showGroupChatModal.value = true
}

// Watch for thread selection to check block status
watch(selectedThreadId, async (newThreadId) => {
  if (newThreadId) {
    await checkBlockStatus()
  } else {
    isCurrentUserBlocked.value = false
    isMessagingBlocked.value = false
    blockedByMe.value = false
  }
})

watch(
  () => ({
    userId: route.query.userId,
    userEmail: route.query.userEmail
  }),
  (newQuery) => {
    const incomingIdentifier = getRouteIdentifier(newQuery)
    const identifierChanged = incomingIdentifier !== lastRouteIdentifier.value

    if (!incomingIdentifier) {
      if (identifierChanged) {
        resetNewConversationState()
      }
      userQueryHandled.value = false
      lastRouteIdentifier.value = null
      return
    }

    if (!identifierChanged && userQueryHandled.value) {
      return
    }

    userQueryHandled.value = false
    lastRouteIdentifier.value = incomingIdentifier
    handleQueryThreadSelection()
  },
  { immediate: true }
)

watch([messageThreads, threadsLoading], () => {
  handleQueryThreadSelection()
}, { immediate: true })

// Initialize on mount
onMounted(async () => {
  try {
    await messageStore.initialize()
    await loadGroupChats()
    await loadSystemMessages() // Load system messages on mount
    handleQueryThreadSelection()
    initializeSocket()
  } catch (error) {
    console.error('Failed to initialize messages view:', error)
    threadsError.value = error.response?.data?.error?.message || 'Failed to load messages'
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupSocket()
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})
</script>

<style scoped>
.main-content {
  flex: 1;
}

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
