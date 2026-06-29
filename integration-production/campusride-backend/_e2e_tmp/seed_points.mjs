// Make the points economy look alive: give real users a believable, skewed points
// distribution (a few big earners, many casual), correlated with how active they are
// (organizers / group creators / participants earn more). Updates users.points only.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

async function main() {
  const dry = process.env.DRY === '1';
  const { data: users } = await sb.from('users').select('id, first_name, points').eq('is_verified', true);
  if (!users?.length) { console.log('no users'); return; }

  // gather "activity signals" so active people rank higher
  const [orgs, creators, parts, members] = await Promise.all([
    sb.from('activities').select('organizer_id'),
    sb.from('groups').select('creator_id'),
    sb.from('activity_participants').select('user_id, attendance_status'),
    sb.from('group_members').select('user_id'),
  ]);
  const score = new Map();
  const bump = (id, n) => { if (id) score.set(id, (score.get(id) || 0) + n); };
  (orgs.data || []).forEach(r => bump(r.organizer_id, 3));
  (creators.data || []).forEach(r => bump(r.creator_id, 3));
  (parts.data || []).forEach(r => bump(r.user_id, r.attendance_status === 'attended' ? 2 : 1));
  (members.data || []).forEach(r => bump(r.user_id, 1));

  // base points per "activity point": registration/verify/profile (~30) + activity rewards
  let updated = 0; const preview = [];
  for (const u of users) {
    const act = score.get(u.id) || 0;
    // everyone has the onboarding points; active users have a lot more, with noise
    let pts = rnd(15, 35)                  // registration(10)+verification(5)+profile(15)-ish
            + act * rnd(8, 18)             // earned from activities/groups
            + (Math.random() < 0.12 ? rnd(120, 480) : 0); // a few standout earners
    // round to a "transaction-like" number
    pts = Math.max(0, Math.round(pts));
    preview.push({ name: u.first_name, act, pts });
    if (!dry) {
      const { error } = await sb.from('users').update({ points: pts }).eq('id', u.id);
      if (!error) updated++;
    }
  }

  preview.sort((a, b) => b.pts - a.pts);
  console.log('Top 12 by points:');
  preview.slice(0, 12).forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p.name}: ${p.pts} pts (activity=${p.act})`));
  const total = preview.reduce((s, p) => s + p.pts, 0);
  console.log(`\n${dry ? '[dry] ' : ''}users=${users.length}, updated=${updated}, avg=${Math.round(total / users.length)}, max=${preview[0].pts}, withPoints=${preview.filter(p => p.pts > 0).length}`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
