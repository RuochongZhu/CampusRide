import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data: groups } = await sb.from('groups').select('id, name, creator_id, member_count').order('created_at');
  for (const g of groups) {
    const { data: mem } = await sb.from('group_members').select('user_id, role').eq('group_id', g.id);
    const ids = (mem||[]).map(m => m.user_id);
    // names
    const { data: us } = ids.length ? await sb.from('users').select('id, first_name').in('id', ids) : { data: [] };
    const nameOf = Object.fromEntries((us||[]).map(u => [u.id, u.first_name]));
    console.log(`${g.name} | id=${g.id} | creator=${g.creator_id}`);
    console.log('   members:', (mem||[]).map(m => `${nameOf[m.user_id]||m.user_id.slice(0,8)}(${m.role})`).join(', ') || '(none)');
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
