import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // 1) item_favorites present?
  const fav = await sb.from('item_favorites').select('id').limit(1);
  console.log('item_favorites:', fav.error ? `MISSING (${fav.error.code} ${fav.error.message})` : `EXISTS (${fav.data.length} sample rows)`);

  // 2) exec_sql RPC?
  const r1 = await sb.rpc('exec_sql', { sql_query: 'select 1 as ok;' });
  console.log('rpc exec_sql:', r1.error ? `NO (${r1.error.code||''} ${r1.error.message})` : `YES -> ${JSON.stringify(r1.data)}`);

  // 3) exec RPC?
  const r2 = await sb.rpc('exec', { sql: 'select 1;' });
  console.log('rpc exec:', r2.error ? `NO (${r2.error.code||''} ${r2.error.message})` : `YES -> ${JSON.stringify(r2.data)}`);

  // 4) increment_user_points RPC? (points design claim)
  const r3 = await sb.rpc('increment_user_points', { user_id: '00000000-0000-0000-0000-000000000000', points_to_add: 0 });
  console.log('rpc increment_user_points:', r3.error ? `NO (${r3.error.code||''} ${r3.error.message})` : `YES`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
