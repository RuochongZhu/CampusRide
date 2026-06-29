import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // participation status distribution
  const { data: aps } = await sb.from('activity_participants').select('attendance_status, payment_status, points_earned, rating');
  const dist = {};
  for (const a of aps) dist[a.attendance_status] = (dist[a.attendance_status]||0)+1;
  console.log('activity_participants total =', aps.length, 'status dist =', JSON.stringify(dist));
  const withRating = aps.filter(a=>a.rating!=null).length;
  const withPoints = aps.filter(a=>a.points_earned>0).length;
  console.log('  with rating =', withRating, ' with points_earned>0 =', withPoints);

  // group_messages per group
  const { data: gmsgs } = await sb.from('group_messages').select('group_id, created_at, deleted_at');
  const per = {};
  for (const m of gmsgs) per[m.group_id] = (per[m.group_id]||0)+1;
  console.log('\ngroup_messages total =', gmsgs.length);
  const { data: groups } = await sb.from('groups').select('id, name, member_count, group_kind');
  for (const g of groups) console.log(`  ${(per[g.id]||0).toString().padStart(3)} msgs | members=${g.member_count} | ${g.name}`);

  // checkins table?
  const ck = await sb.from('activity_checkins').select('*',{count:'exact',head:true});
  console.log('\nactivity_checkins:', ck.error? ('ERR '+ck.error.message): ('count='+ck.count));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
