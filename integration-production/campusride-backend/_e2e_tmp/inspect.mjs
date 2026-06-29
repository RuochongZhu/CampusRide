import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const j = (x) => JSON.stringify(x);

async function main() {
  // groups
  const { data: groups } = await sb.from('groups').select('id, name, description, group_kind, member_count, creator_id, ride_id').order('created_at', { ascending: true });
  console.log('=== GROUPS (' + (groups?.length||0) + ') ===');
  for (const g of (groups||[])) console.log(`${g.id} | kind=${g.group_kind} | members=${g.member_count} | "${g.name}" | creator=${g.creator_id}`);

  // group_members
  const { data: gm, count: gmCount } = await sb.from('group_members').select('group_id, user_id, role', { count: 'exact' });
  console.log('\n=== group_members total =', gmCount, '===');
  const byG = {};
  for (const m of (gm||[])) { (byG[m.group_id] ||= []).push(m); }
  for (const [gid, arr] of Object.entries(byG)) console.log(`${gid}: ${arr.length} members`);

  // group_messages counts per group
  const { data: gmsg, count: gmsgCount } = await sb.from('group_messages').select('group_id', { count: 'exact' });
  console.log('\n=== group_messages total =', gmsgCount, '===');
  const msgBy = {};
  for (const m of (gmsg||[])) msgBy[m.group_id] = (msgBy[m.group_id]||0)+1;
  console.log(j(msgBy));

  // activities
  const { data: acts, count: actCount } = await sb.from('activities').select('id, title, category, type, status, start_time, end_time, location, location_coordinates, current_participants, max_participants, organizer_id', { count: 'exact' }).order('start_time', { ascending: true });
  console.log('\n=== ACTIVITIES (' + actCount + ') ===');
  for (const a of (acts||[])) console.log(`${a.id} | ${a.status} | ${a.category}/${a.type} | parts=${a.current_participants}/${a.max_participants} | coords=${j(a.location_coordinates)} | start=${a.start_time} | "${a.title}" @ ${a.location}`);

  // activity_participants
  const { count: apCount } = await sb.from('activity_participants').select('id', { count: 'exact', head: true });
  console.log('\nactivity_participants total =', apCount);

  // users sample
  const { data: users, count: uCount } = await sb.from('users').select('id, first_name, last_name, email', { count: 'exact' }).limit(15);
  console.log('\n=== USERS total =', uCount, ' (sample 15) ===');
  for (const u of (users||[])) console.log(`${u.id} | ${u.first_name} ${u.last_name} | ${u.email}`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
