import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data: acts } = await sb.from('activities').select('id, title, status, current_participants');
  let fixed = 0;
  for (const a of (acts || [])) {
    // "participants" = anyone who didn't cancel (registered + attended + no_show)
    const { count } = await sb.from('activity_participants')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', a.id)
      .neq('attendance_status', 'cancelled');
    const real = count || 0;
    if (real !== a.current_participants) {
      console.log(`fix "${a.title}" (${a.status}): ${a.current_participants} -> ${real}`);
      const { error } = await sb.from('activities').update({ current_participants: real }).eq('id', a.id);
      if (error) console.log('  ERR', error.message); else fixed++;
    }
  }
  console.log(`\nreconciled ${fixed} activities`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
