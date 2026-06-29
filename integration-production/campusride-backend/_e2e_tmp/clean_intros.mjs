import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ids = [
  'f2557feb-b5d0-446c-923f-15e5f390c2db', // Movie!
  '9c83c24f-d743-478e-98b0-34772ee5fbce', // Vacation
  'd4ad9583-e62c-4ad0-9599-84d456c8a26c', // Metalcore
];
const { data, error } = await sb.from('group_messages').delete().in('group_id', ids).select('id');
console.log(error ? error.message : `deleted ${data.length} old intro messages from the 3 groups`);
process.exit(0);
