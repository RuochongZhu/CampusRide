# Marketplace Database Setup Guide

## 📋 Overview
This guide will help you set up the marketplace database tables in Supabase.

## 🚀 Quick Setup Steps

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `jfgenxnqpuutgdnnngsl`

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click **New Query**

### Step 3: Run Migration
1. Copy the entire contents of:
   ```
   integration/campusride-backend/database/migrations/004_marketplace_schema.sql
   ```
2. Paste it into the SQL Editor
3. Click **Run** or press `Ctrl/Cmd + Enter`

### Step 4: Verify Tables Created
After running the migration, verify the following tables exist:

**In the Table Editor:**
- ✅ `marketplace_items`
- ✅ `item_favorites`

**Check columns in `marketplace_items`:**
- id, seller_id, title, description, category, price, condition
- location, images, tags, status, views_count, favorites_count
- created_at, updated_at

## 📊 Database Schema

### marketplace_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | Foreign key to users table |
| title | VARCHAR(255) | Item title |
| description | TEXT | Item description |
| category | VARCHAR(100) | Category (Electronics, Books, etc.) |
| price | DECIMAL(10,2) | Item price |
| condition | VARCHAR(50) | Condition (new, like_new, good, fair, poor) |
| location | VARCHAR(255) | Item location |
| images | JSONB | Array of image URLs |
| tags | JSONB | Array of tags |
| status | VARCHAR(50) | Status (active, sold, removed) |
| views_count | INTEGER | Number of views |
| favorites_count | INTEGER | Number of favorites |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### item_favorites
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| item_id | UUID | Foreign key to marketplace_items |
| created_at | TIMESTAMP | Creation timestamp |

## 🔒 Security Features

The migration includes:
- **Row Level Security (RLS)** policies
- **Indexes** for better query performance
- **Triggers** for automatic timestamp updates
- **Views** for simplified querying

## 🧪 Test the Setup

After migration, you can test with this SQL:

```sql
-- Insert a test item (replace with your user ID)
INSERT INTO marketplace_items (seller_id, title, description, category, price, condition)
VALUES (
  'YOUR_USER_ID_HERE',
  'Test Item',
  'This is a test marketplace item',
  'Electronics',
  99.99,
  'new'
);

-- Query items
SELECT * FROM marketplace_items_with_seller WHERE status = 'active';
```

## ❓ Troubleshooting

### Issue: Foreign key constraint fails
**Solution:** Make sure the `users` table exists first. If not, run the user schema migration first.

### Issue: RLS policies block access
**Solution:** Temporarily disable RLS for testing:
```sql
ALTER TABLE marketplace_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_favorites DISABLE ROW LEVEL SECURITY;
```

### Issue: Permission denied
**Solution:** Make sure you're using the service role key in your backend .env file.

## 🔄 Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd integration/campusride-backend
supabase db push
```

## ✅ Next Steps

After database setup:
1. ✅ Tables created
2. ⏭️ Update frontend to connect to backend API
3. ⏭️ Test marketplace functionality
4. ⏭️ Add sample data for testing
