import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}

if (!supabaseServiceKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_KEY');
}

// Create Supabase client for server-side operations (with service key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for client-side operations (with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lightweight database connectivity check used by the health endpoint.
// We intentionally avoid selecting any non-existent columns and only
// perform a HEAD-style query against a known table. If the table does
// not exist yet (fresh environment), we treat that as a reachable DB
// rather than a hard failure so the server can still boot.
export const testConnection = async () => {
  try {
    // Use a minimal select with head=true so no rows are transferred.
    // This verifies reachability and auth without relying on table schema.
    const { error } = await supabaseAdmin
      .from('users')
      .select('id', { head: true })
      .limit(1);
    
    // PGRST116 means the table is missing; that's OK for connectivity checks
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Database reachable');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default { supabase, supabaseAdmin, testConnection }; 
