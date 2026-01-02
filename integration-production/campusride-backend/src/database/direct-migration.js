import { supabaseAdmin } from '../config/database.js';

async function runDirectMigration() {
  try {
    console.log('📊 Running direct database migration...');
    
    // Check if columns already exist by trying to select them
    console.log('1. Checking existing schema...');
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, major, university, points')
      .limit(1);
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('❌ Required columns missing. Please execute these SQL commands in your Supabase dashboard:');
      console.log('');
      console.log('-- Add missing columns to users table');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(255);');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255);');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;');
      console.log('');
      console.log('-- Update existing records with default values');
      console.log("UPDATE users SET major = 'Computer Science' WHERE major IS NULL;");
      console.log("UPDATE users SET university = 'Cornell University' WHERE university IS NULL;");
      console.log('UPDATE users SET points = 0 WHERE points IS NULL;');
      console.log('');
      console.log('-- Create indexes for the new columns');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);');
      console.log('');
      console.log('-- Create missing tables');
      console.log(`CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  base_points INTEGER NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      console.log('');
      console.log(`CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(50),
  reason TEXT,
  metadata JSONB,
  multiplier INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      console.log('');
      console.log(`CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  points INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      console.log('');
      console.log('-- Insert default point rules');
      console.log(`INSERT INTO point_rules (rule_type, name, base_points, description, category) VALUES
('registration', '用户注册', 10, '成功注册账户获得积分', 'system'),
('verification', '邮箱验证', 5, '完成邮箱验证获得积分', 'system'),
('daily_login', '每日登录', 1, '每日首次登录获得积分', 'system'),
('profile_complete', '完善资料', 15, '完善用户资料获得积分', 'system')
ON CONFLICT (rule_type) DO NOTHING;`);
      console.log('');
      
      // Try to create the tables that don't depend on missing columns
      console.log('2. Creating point_rules table...');
      try {
        const { error: pointRulesError } = await supabaseAdmin
          .from('point_rules')
          .select('id')
          .limit(1);
        
        if (pointRulesError && pointRulesError.message.includes('does not exist')) {
          console.log('❌ point_rules table does not exist. Please create it manually using the SQL above.');
        } else {
          console.log('✅ point_rules table exists');
        }
      } catch (e) {
        console.log('❌ point_rules table needs to be created manually');
      }
      
      process.exit(1);
    } else {
      console.log('✅ All required columns exist');
      
      // Update existing records with default values if they are null
      console.log('2. Updating existing records with default values...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          major: 'Computer Science',
          university: 'Cornell University',
          points: 0 
        })
        .or('major.is.null,university.is.null,points.is.null');
        
      if (updateError) {
        console.log('⚠️ Update error:', updateError.message);
      } else {
        console.log('✅ Updated existing records');
      }
      
      // Try to insert default point rules
      console.log('3. Inserting default point rules...');
      const pointRules = [
        { rule_type: 'registration', name: '用户注册', base_points: 10, description: '成功注册账户获得积分', category: 'system' },
        { rule_type: 'verification', name: '邮箱验证', base_points: 5, description: '完成邮箱验证获得积分', category: 'system' },
        { rule_type: 'daily_login', name: '每日登录', base_points: 1, description: '每日首次登录获得积分', category: 'system' },
        { rule_type: 'profile_complete', name: '完善资料', base_points: 15, description: '完善用户资料获得积分', category: 'system' }
      ];
      
      for (const rule of pointRules) {
        const { error: ruleError } = await supabaseAdmin
          .from('point_rules')
          .upsert(rule, { onConflict: 'rule_type' });
        
        if (ruleError) {
          console.log(`⚠️ Rule ${rule.rule_type} error:`, ruleError.message);
        } else {
          console.log(`✅ Inserted rule: ${rule.name}`);
        }
      }
      
      console.log('✅ Migration completed successfully');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runDirectMigration();