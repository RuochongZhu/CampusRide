import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const gm = await sb.from('group_messages').select('*').limit(2);
  console.log('=== group_messages sample columns ===');
  console.log(gm.error ? gm.error : (gm.data[0] ? Object.keys(gm.data[0]) : 'no rows'));
  if (gm.data && gm.data[0]) console.log('sample row:', JSON.stringify(gm.data[0]));

  const ap = await sb.from('activity_participants').select('*').limit(1);
  console.log('\n=== activity_participants columns ===');
  console.log(ap.error ? ap.error : (ap.data[0] ? Object.keys(ap.data[0]) : 'no rows'));

  // attendance_status distribution
  const all = await sb.from('activity_participants').select('attendance_status, payment_status, rating, activity_id');
  const dist = {};
  let rated = 0;
  for (const r of (all.data||[])) { dist[r.attendance_status] = (dist[r.attendance_status]||0)+1; if (r.rating!=null) rated++; }
  console.log('attendance_status dist:', JSON.stringify(dist), '| rated rows:', rated);

  // members per group with names, for seeding chats
  const { data: gms } = await sb.from('group_members').select('group_id, user_id, role');
  const uids = [...new Set((gms||[]).map(m=>m.user_id))];
  const { data: users } = await sb.from('users').select('id, first_name, last_name').in('id', uids);
  const nameOf = Object.fromEntries((users||[]).map(u=>[u.id, u.first_name]));
  const byG = {};
  for (const m of (gms||[])) (byG[m.group_id] ||= []).push({ id:m.user_id, name:nameOf[m.user_id]||'?', role:m.role });
  console.log('\n=== members by group (id->names) ===');
  for (const [gid, arr] of Object.entries(byG)) console.log(gid, '=>', arr.map(a=>`${a.name}${a.role==='creator'?'*':''}`).join(', '));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
