# 🔧 Database Migration Instructions

## Step 1: Execute Comments System Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**:
   - Click on your project
   - Go to "SQL Editor" in the left sidebar
3. **Copy and paste** the content from:
   ```
   integration/campusride-backend/database/migrations/005_marketplace_comments.sql
   ```
4. **Click "Run"** to execute the SQL
5. **Verify**: Check "Table Editor" to confirm:
   - `marketplace_comments` table exists
   - `marketplace_comment_likes` table exists
   - Triggers are created

### Option B: Using psql Command Line

If you have psql installed:

```bash
# Set your Supabase database connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Execute migration
psql $DATABASE_URL -f integration/campusride-backend/database/migrations/005_marketplace_comments.sql
```

---

## Step 2: Verify Migration Success

Run this SQL query in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('marketplace_comments', 'marketplace_comment_likes');

-- Check if triggers exist
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('marketplace_comments', 'marketplace_comment_likes');
```

Expected output:
- 2 tables: `marketplace_comments`, `marketplace_comment_likes`
- 2 triggers: `trigger_update_comment_likes`, `trigger_update_marketplace_comments_updated_at`

---

## Step 3: Test API Connection

After database migration, the backend API should be able to connect:

```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide
chmod +x test-comments-api.sh
./test-comments-api.sh
```

---

## ⚠️ Troubleshooting

### Problem: "relation already exists"
**Solution**: Tables are already created, you can skip this step.

### Problem: "permission denied"
**Solution**: Make sure you're using the service role key or database password with proper permissions.

### Problem: API returns "relation does not exist"
**Solution**:
1. Double-check the migration was executed successfully
2. Restart the backend server
3. Check the Supabase logs for connection errors

---

## 🎉 After Migration

Once migration is complete, you can:
1. ✅ Use the comment API endpoints
2. ✅ Test with the frontend components (being created next)
3. ✅ View comments in the Supabase Table Editor

**Status**: ⏳ Waiting for you to execute the migration in Supabase Dashboard
