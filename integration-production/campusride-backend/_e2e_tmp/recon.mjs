import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const j = (x) => JSON.stringify(x, null, 0);

async function main() {
  // GROUPS
  const { data: groups } = await sb.from('groups')
    .select('id, name, description, group_kind, creator_id, member_count, ride_id, created_at')
    .order('created_at', { ascending: true });
  console.log('=== GROUPS (' + (groups?.length||0) + ') ===');
  for (const g of (groups||[])) console.log(`${g.id} | kind=${g.group_kind} | members=${g.member_count} | ${g.name}  :: ${(g.description||'').slice(0,60)}`);

  // sample group_members + group_messages columns
  const gm = await sb.from('group_members').select('*').limit(1);
  console.log('\n=== group_members cols ===', gm.error? gm.error.message : Object.keys(gm.data[0]||{}));
  const gmsg = await sb.from('group_messages').select('*').limit(1);
  console.log('=== group_messages cols ===', gmsg.error? gmsg.error.message : Object.keys(gmsg.data[0]||{}));

  // ACTIVITIES
  const { data: acts } = await sb.from('activities')
    .select('id, title, category, type, location, location_coordinates, start_time, end_time, status, max_participants, current_participants, organizer_id, checkin_code, location_verification')
    .order('start_time', { ascending: true });
  console.log('\n=== ACTIVITIES (' + (acts?.length||0) + ') ===');
  for (const a of (acts||[])) console.log(`${a.id} | ${a.status} | ${a.start_time} -> ${a.end_time} | cur=${a.current_participants}/${a.max_participants} | coords=${j(a.location_coordinates)} | ${a.title} @ ${a.location}`);

  const ap = await sb.from('activity_participants').select('*').limit(1);
  console.log('\n=== activity_participants cols ===', ap.error? ap.error.message : Object.keys(ap.data[0]||{}));
  const { count: apCount } = await sb.from('activity_participants').select('*', { count:'exact', head:true });
  console.log('activity_participants count =', apCount);

  // USERS pool (verified cornell)
  const { data: users } = await sb.from('users')
    .select('id, first_name, last_name, email, is_verified')
    .eq('is_verified', true)
    .limit(50);
  console.log('\n=== USERS pool (' + (users?.length||0) + ' shown) ===');
  for (const u of (users||[])) console.log(`${u.id} | ${u.first_name} ${u.last_name} | ${u.email}`);

  console.log('\nNOW =', new Date().toISOString());
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
