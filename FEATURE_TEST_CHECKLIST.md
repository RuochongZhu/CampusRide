# CampusRide 功能测试清单 / Feature Test Checklist

**测试日期 / Test Date:** _______________
**测试人员 / Tester:** _______________
**测试环境 / Environment:** _______________

---

## 1. 认证与账户管理 / Authentication & Account Management

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 1.1 | 用户注册 / User Registration | 填写邮箱、密码注册新账户 / Fill email, password to register | | | |
| 1.2 | 邮箱验证 / Email Verification | 点击验证邮件中的链接 / Click verification link in email | | | |
| 1.3 | 重发验证邮件 / Resend Verification | 请求重新发送验证邮件 / Request resend verification email | | | |
| 1.4 | 用户登录 / User Login | 使用邮箱密码登录 / Login with email and password | | | |
| 1.5 | 游客登录 / Guest Login | 以游客身份临时访问 / Access as guest temporarily | | | |
| 1.6 | 忘记密码 / Forgot Password | 请求密码重置邮件 / Request password reset email | | | |
| 1.7 | 重置密码 / Reset Password | 通过邮件链接重置密码 / Reset password via email link | | | |
| 1.8 | 退出登录 / Logout | 点击退出登录按钮 / Click logout button | | | |

---

## 2. 用户资料 / User Profile

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 2.1 | 查看个人资料 / View Profile | 进入个人资料页面 / Navigate to profile page | | | |
| 2.2 | 编辑个人资料 / Edit Profile | 修改个人信息并保存 / Modify info and save | | | |
| 2.3 | 上传头像 / Upload Avatar | 上传新头像图片 / Upload new avatar image | | | |
| 2.4 | 查看积分历史 / View Points History | 查看积分获取记录 / View points earning history | | | |
| 2.5 | 隐藏排名 / Hide Rank | 设置不在排行榜显示 / Toggle rank visibility off | | | |

---

## 3. 拼车功能 / Rideshare

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 3.1 | 发布行程 / Create Ride | 填写出发地、目的地、时间发布 / Fill origin, destination, time | | | |
| 3.2 | 浏览行程 / Browse Rides | 查看所有可用行程列表 / View all available rides | | | |
| 3.3 | 搜索行程 / Search Rides | 按条件筛选行程 / Filter rides by criteria | | | |
| 3.4 | 查看行程详情 / View Ride Details | 点击查看行程完整信息 / Click to view full ride info | | | |
| 3.5 | 预订行程 / Book Ride | 作为乘客预订行程 / Book ride as passenger | | | |
| 3.6 | 查看我的行程 / View My Rides | 查看我发布的行程 / View rides I posted | | | |
| 3.7 | 查看我的预订 / View My Bookings | 查看我预订的行程 / View rides I booked | | | |
| 3.8 | 取消预订 / Cancel Booking | 取消已预订的行程 / Cancel a booked ride | | | |
| 3.9 | 完成行程 / Complete Ride | 标记行程为已完成 / Mark ride as completed | | | |
| 3.10 | 编辑行程 / Edit Ride | 修改已发布的行程信息 / Edit posted ride info | | | |
| 3.11 | 删除行程 / Delete Ride | 删除已发布的行程 / Delete posted ride | | | |

---

## 4. 校园活动 / Campus Activities

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 4.1 | 创建活动 / Create Activity | 填写活动信息并发布 / Fill activity info and publish | | | |
| 4.2 | 浏览活动 / Browse Activities | 查看所有活动列表 / View all activities list | | | |
| 4.3 | 搜索活动 / Search Activities | 按关键词搜索活动 / Search activities by keywords | | | |
| 4.4 | 查看活动详情 / View Activity Details | 点击查看活动完整信息 / Click to view full activity info | | | |
| 4.5 | 报名活动 / Register for Activity | 点击报名参加活动 / Click to register for activity | | | |
| 4.6 | 取消报名 / Cancel Registration | 取消已报名的活动 / Cancel registered activity | | | |
| 4.7 | 查看参与历史 / View Participation History | 查看我参加过的活动 / View activities I participated in | | | |
| 4.8 | 编辑活动 / Edit Activity | 修改已发布的活动 / Edit posted activity | | | |
| 4.9 | 删除活动 / Delete Activity | 删除已发布的活动 / Delete posted activity | | | |

---

## 5. 活动签到 / Activity Check-in

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 5.1 | 生成签到二维码 / Generate QR Code | 组织者生成签到二维码 / Organizer generates QR code | | | |
| 5.2 | 扫码签到 / Scan QR to Check-in | 参与者扫码完成签到 / Participant scans QR to check in | | | |
| 5.3 | 查看签到统计 / View Check-in Stats | 组织者查看签到情况 / Organizer views check-in stats | | | |
| 5.4 | 查看签到历史 / View Check-in History | 查看我的签到记录 / View my check-in history | | | |

---

## 6. 活动评论与聊天 / Activity Comments & Chat

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 6.1 | 发送活动聊天消息 / Send Activity Chat | 在活动聊天中发送消息 / Send message in activity chat | | | |
| 6.2 | 查看聊天成员 / View Chat Members | 查看活动聊天参与者 / View activity chat participants | | | |
| 6.3 | 删除聊天消息 / Delete Chat Message | 删除自己发送的消息 / Delete own sent message | | | |
| 6.4 | 添加活动评论 / Add Activity Comment | 对活动发表评论 / Post comment on activity | | | |
| 6.5 | 删除评论 / Delete Comment | 删除自己的评论 / Delete own comment | | | |
| 6.6 | 联系组织者 / Contact Organizer | 联系活动组织者 / Contact activity organizer | | | |

---

## 7. 二手市场 / Marketplace

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 7.1 | 发布商品 / Create Item Listing | 填写商品信息并发布 / Fill item info and publish | | | |
| 7.2 | 上传商品图片 / Upload Item Images | 上传商品照片 / Upload item photos | | | |
| 7.3 | 浏览商品 / Browse Items | 查看所有商品列表 / View all items list | | | |
| 7.4 | 搜索商品 / Search Items | 按关键词搜索商品 / Search items by keywords | | | |
| 7.5 | 查看商品详情 / View Item Details | 点击查看商品完整信息 / Click to view full item info | | | |
| 7.6 | 收藏商品 / Favorite Item | 将商品添加到收藏 / Add item to favorites | | | |
| 7.7 | 取消收藏 / Unfavorite Item | 从收藏中移除商品 / Remove item from favorites | | | |
| 7.8 | 查看收藏列表 / View Favorites | 查看我收藏的商品 / View my favorite items | | | |
| 7.9 | 查看我的商品 / View My Items | 查看我发布的商品 / View items I posted | | | |
| 7.10 | 编辑商品 / Edit Item | 修改已发布的商品 / Edit posted item | | | |
| 7.11 | 删除商品 / Delete Item | 删除已发布的商品 / Delete posted item | | | |
| 7.12 | 商品评论 / Item Comments | 对商品发表评论 / Post comment on item | | | |
| 7.13 | 点赞评论 / Like Comment | 点赞商品评论 / Like item comment | | | |

---

## 8. 群组与社区 / Groups & Communities

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 8.1 | 创建群组 / Create Group | 填写群组信息并创建 / Fill group info and create | | | |
| 8.2 | 浏览群组 / Browse Groups | 查看所有群组列表 / View all groups list | | | |
| 8.3 | 查看群组详情 / View Group Details | 点击查看群组完整信息 / Click to view full group info | | | |
| 8.4 | 加入群组 / Join Group | 加入一个群组 / Join a group | | | |
| 8.5 | 退出群组 / Leave Group | 退出已加入的群组 / Leave joined group | | | |
| 8.6 | 查看群组成员 / View Group Members | 查看群组成员列表 / View group members list | | | |
| 8.7 | 发送群组消息 / Send Group Message | 在群组中发送消息 / Send message in group | | | |
| 8.8 | 查看群组消息 / View Group Messages | 查看群组聊天记录 / View group chat history | | | |
| 8.9 | 删除群组 / Delete Group | 创建者删除群组 / Creator deletes group | | | |

---

## 9. 想法/动态 / Thoughts/Ideas

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 9.1 | 发布想法 / Post Thought | 发布带位置的想法 / Post thought with location | | | |
| 9.2 | 查看想法时间线 / View Thoughts Timeline | 查看想法动态列表 / View thoughts feed | | | |
| 9.3 | 地图查看想法 / View Thoughts on Map | 在地图上查看想法 / View thoughts on map | | | |
| 9.4 | 删除想法 / Delete Thought | 删除自己发布的想法 / Delete own posted thought | | | |

---

## 10. 私信消息 / Direct Messages

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 10.1 | 发送私信 / Send Direct Message | 向用户发送私信 / Send DM to user | | | |
| 10.2 | 查看消息列表 / View Message Threads | 查看所有消息会话 / View all message threads | | | |
| 10.3 | 查看会话消息 / View Thread Messages | 查看会话中的消息 / View messages in thread | | | |
| 10.4 | 回复消息 / Reply to Message | 回复收到的消息 / Reply to received message | | | |
| 10.5 | 标记已读 / Mark as Read | 标记消息为已读 / Mark message as read | | | |
| 10.6 | 删除消息 / Delete Message | 删除消息 / Delete message | | | |
| 10.7 | 消息表情反应 / Message Reactions | 对消息添加表情反应 / Add emoji reaction to message | | | |
| 10.8 | 查看未读数量 / View Unread Count | 查看未读消息数量 / View unread message count | | | |

---

## 11. 用户屏蔽 / User Blocking

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 11.1 | 屏蔽用户 / Block User | 屏蔽某个用户 / Block a user | | | |
| 11.2 | 取消屏蔽 / Unblock User | 取消屏蔽用户 / Unblock a user | | | |
| 11.3 | 查看屏蔽列表 / View Blocked Users | 查看已屏蔽的用户 / View blocked users list | | | |

---

## 12. 系统消息 / System Messages

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 12.1 | 查看系统消息 / View System Messages | 查看系统公告消息 / View system announcements | | | |
| 12.2 | 标记系统消息已读 / Mark System Msg Read | 标记系统消息为已读 / Mark system message as read | | | |
| 12.3 | 删除系统消息 / Delete System Message | 删除系统消息 / Delete system message | | | |

---

## 13. 排行榜与积分 / Leaderboard & Points

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 13.1 | 查看排行榜 / View Leaderboard | 查看全局排行榜 / View global leaderboard | | | |
| 13.2 | 查看我的排名 / View My Ranking | 查看自己的排名 / View own ranking | | | |
| 13.3 | 查看积分 / View Points | 查看自己的积分 / View own points | | | |
| 13.4 | 查看积分历史 / View Points History | 查看积分获取记录 / View points earning history | | | |

---

## 14. 评分系统 / Rating System

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 14.1 | 评价行程 / Rate Ride | 对完成的行程评分 / Rate completed ride | | | |
| 14.2 | 查看用户评分 / View User Ratings | 查看用户收到的评分 / View ratings user received | | | |
| 14.3 | 评价活动 / Rate Activity | 对参加的活动评分 / Rate attended activity | | | |
| 14.4 | 查看活动评分 / View Activity Ratings | 查看活动的评分 / View activity ratings | | | |

---

## 15. 通知 / Notifications

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 15.1 | 查看通知 / View Notifications | 查看通知列表 / View notifications list | | | |
| 15.2 | 标记通知已读 / Mark Notification Read | 标记单个通知为已读 / Mark single notification as read | | | |
| 15.3 | 全部标记已读 / Mark All Read | 标记所有通知为已读 / Mark all notifications as read | | | |
| 15.4 | 删除通知 / Delete Notification | 删除通知 / Delete notification | | | |
| 15.5 | 查看未读数量 / View Unread Count | 查看未读通知数量 / View unread notification count | | | |

---

## 16. 好友系统 / Friends System

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 16.1 | 查看好友列表 / View Friends List | 查看我的好友 / View my friends | | | |
| 16.2 | 发送好友请求 / Send Friend Request | 向用户发送好友请求 / Send friend request to user | | | |
| 16.3 | 查看好友请求 / View Friend Requests | 查看收到的好友请求 / View received friend requests | | | |
| 16.4 | 接受好友请求 / Accept Friend Request | 接受好友请求 / Accept friend request | | | |
| 16.5 | 拒绝好友请求 / Reject Friend Request | 拒绝好友请求 / Reject friend request | | | |
| 16.6 | 删除好友 / Remove Friend | 删除好友 / Remove friend | | | |

---

## 17. 优惠券 / Coupons

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 17.1 | 查看优惠券 / View Coupons | 查看我的优惠券 / View my coupons | | | |
| 17.2 | 使用优惠券 / Use Coupon | 使用优惠券 / Use coupon | | | |
| 17.3 | 查看优惠券历史 / View Coupon History | 查看优惠券使用记录 / View coupon usage history | | | |

---

## 18. 位置可见性 / Location Visibility

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 18.1 | 设置可见性 / Set Visibility | 设置是否在地图上显示 / Set whether to show on map | | | |
| 18.2 | 查看可见用户 / View Visible Users | 在地图上查看可见用户 / View visible users on map | | | |

---

## 19. 管理员功能 / Admin Features

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 19.1 | 查看仪表盘 / View Dashboard | 查看管理员仪表盘 / View admin dashboard | | | |
| 19.2 | 查看用户列表 / View User List | 查看所有用户 / View all users | | | |
| 19.3 | 封禁用户 / Ban User | 封禁违规用户 / Ban violating user | | | |
| 19.4 | 解封用户 / Unban User | 解除用户封禁 / Unban user | | | |
| 19.5 | 授予管理员 / Grant Admin | 授予用户管理员权限 / Grant admin role to user | | | |
| 19.6 | 撤销管理员 / Revoke Admin | 撤销管理员权限 / Revoke admin role | | | |
| 19.7 | 授予商家 / Grant Merchant | 授予商家权限 / Grant merchant role | | | |
| 19.8 | 撤销商家 / Revoke Merchant | 撤销商家权限 / Revoke merchant role | | | |
| 19.9 | 删除内容 / Delete Content | 删除违规内容 / Delete violating content | | | |
| 19.10 | 发送公告 / Send Announcement | 发送系统公告 / Send system announcement | | | |
| 19.11 | 发放优惠券 / Distribute Coupons | 发放每周优惠券 / Distribute weekly coupons | | | |

---

## 20. 法律页面 / Legal Pages

| # | 功能 / Feature | 测试步骤 / Test Steps | 通过 ✓ | 失败 ✗ | 备注 / Notes |
|---|---------------|----------------------|--------|--------|--------------|
| 20.1 | 服务条款 / Terms of Service | 查看服务条款页面 / View terms of service page | | | |
| 20.2 | 隐私政策 / Privacy Policy | 查看隐私政策页面 / View privacy policy page | | | |
| 20.3 | Cookie政策 / Cookie Policy | 查看Cookie政策页面 / View cookie policy page | | | |
| 20.4 | 拼车免责声明 / Carpool Disclaimer | 查看拼车免责声明 / View carpool disclaimer | | | |
| 20.5 | 披露与透明度 / Disclosures | 查看披露与透明度 / View disclosures & transparency | | | |

---

## 测试总结 / Test Summary

| 类别 / Category | 总数 / Total | 通过 / Passed | 失败 / Failed | 通过率 / Pass Rate |
|----------------|-------------|--------------|--------------|-------------------|
| 认证与账户 / Auth & Account | 8 | | | |
| 用户资料 / User Profile | 5 | | | |
| 拼车 / Rideshare | 11 | | | |
| 校园活动 / Activities | 9 | | | |
| 活动签到 / Check-in | 4 | | | |
| 活动评论聊天 / Activity Chat | 6 | | | |
| 二手市场 / Marketplace | 13 | | | |
| 群组社区 / Groups | 9 | | | |
| 想法动态 / Thoughts | 4 | | | |
| 私信消息 / Direct Messages | 8 | | | |
| 用户屏蔽 / User Blocking | 3 | | | |
| 系统消息 / System Messages | 3 | | | |
| 排行榜积分 / Leaderboard | 4 | | | |
| 评分系统 / Ratings | 4 | | | |
| 通知 / Notifications | 5 | | | |
| 好友系统 / Friends | 6 | | | |
| 优惠券 / Coupons | 3 | | | |
| 位置可见性 / Visibility | 2 | | | |
| 管理员功能 / Admin | 11 | | | |
| 法律页面 / Legal | 5 | | | |
| **总计 / Total** | **123** | | | |

---

## 问题记录 / Issues Found

| # | 功能编号 / Feature # | 问题描述 / Issue Description | 严重程度 / Severity | 状态 / Status |
|---|---------------------|----------------------------|-------------------|--------------|
| 1 | | | High/Medium/Low | Open/Fixed |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

---

**测试完成签名 / Tester Signature:** _______________
**日期 / Date:** _______________
