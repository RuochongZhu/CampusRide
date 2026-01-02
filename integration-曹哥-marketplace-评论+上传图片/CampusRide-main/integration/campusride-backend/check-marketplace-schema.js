import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking marketplace_items table schema...\n');
  
  const { data, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample item structure:', data[0] ? Object.keys(data[0]) : 'No items found');
  }
}

checkSchema().then(() => process.exit(0));
