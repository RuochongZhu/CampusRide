import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createMockSupabaseClient, initMockDatabase } from '../utils/mock-database.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const USE_DEMO_MODE = process.env.USE_DEMO_MODE === 'true';

let usingDemoMode = USE_DEMO_MODE;
let realSupabaseAdmin;
let realSupabase;

if (USE_DEMO_MODE) {
  console.log('🎭 启动演示模式（内存数据库）');
  await initMockDatabase();
}

// Create Supabase clients
if (supabaseUrl && supabaseServiceKey && !USE_DEMO_MODE) {
  realSupabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  realSupabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Export clients (use demo mode if specified or if real clients don't exist)
export const supabaseAdmin = USE_DEMO_MODE || !realSupabaseAdmin ? createMockSupabaseClient() : realSupabaseAdmin;
export const supabase = USE_DEMO_MODE || !realSupabase ? createMockSupabaseClient() : realSupabase;

// Database connection test
export const testConnection = async () => {
  if (USE_DEMO_MODE) {
    console.log('✅ 演示模式数据库已就绪');
    return true;
  }
  
  try {
    const { data, error } = await realSupabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table does not exist"
      throw error;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 提示: 设置 USE_DEMO_MODE=true 使用演示模式');
    return false;
  }
};

export const isDemoMode = () => usingDemoMode;

export default { supabase, supabaseAdmin, testConnection, isDemoMode }; 