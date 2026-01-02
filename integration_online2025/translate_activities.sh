#!/bin/bash

# Script to translate Chinese text to English in frontend files

# Translation mappings for ActivitiesView.vue
declare -A translations
translations["浏览小组"]="Browse Groups"
translations["创建小组"]="Create Group"
translations["发布活动"]="Post Activity"
translations["参加历史"]="Participation History"
translations["出现"]="Visible"
translations["隐身"]="Invisible"
translations["暂无描述"]="No description"
translations["成员"]="Members"
translations["群聊"]="Group Chat"
translations["删除小组"]="Delete Group"
translations["退出小组"]="Leave Group"
translations["你还没有加入任何小组"]="You haven't joined any groups yet"
translations["正在进行"]="In Progress"
translations["开始倒计时"]="Starting countdown"
translations["査看详情"]="View Details"
translations["想法位置"]="Thought Locations"
translations["可见用户"]="Visible Users"
translations["我的位置"]="My Location"
translations["浏览所有小组"]="Browse All Groups"
translations["活动签到"]="Activity Check-in"
translations["验证您的位置和时间以完成签到"]="Verify your location and time to complete check-in"
translations["签到要求说明"]="Check-in Requirements"
translations["活动时间"]="Activity Time"
translations["活动地点"]="Activity Location"
translations["需要在活动时间段内，且距离活动地点"]="Must be within activity time and within"
translations["米以内"]="meters of the activity location"
translations["取消"]="Cancel"
translations["验证中..."]="Verifying..."
translations["立即签到"]="Check In Now"
translations["已退出小组"]="Left the group"
translations["退出小组失败"]="Failed to leave group"
translations["删除小组失败"]="Failed to delete group"
translations["您已出现在地图上"]="You are now visible on the map"
translations["您已隐身"]="You are now invisible"

# File to translate
FILE="/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/src/views/ActivitiesView.vue"

# Make a backup
cp "$FILE" "$FILE.backup"

# Replace each Chinese text with English
for chinese in "${!translations[@]}"; do
    english="${translations[$chinese]}"
    sed -i '' "s|$chinese|$english|g" "$FILE"
done

echo "Translation completed for ActivitiesView.vue"
echo "Backup created at: $FILE.backup"