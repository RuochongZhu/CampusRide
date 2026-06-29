import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const FEEDBACK = {
  volunteer: ["Felt great giving back, well organized!", "Lots of trash collected, good crew 💪", "Would do it again, meaningful morning."],
  social:    ["So much fun, loved the films!", "Great vibes, met cool people 🎬", "Cozy night, popcorn was clutch."],
  sports:    ["Intense matches, super fun!", "Great workout, well run tournament 🏸", "Competitive but friendly, loved it."],
  technology:["Really insightful talk!", "Speaker was great, learned a lot 🤖", "Good Q&A, wish it were longer."],
  academic:  ["Super helpful review session", "Cleared up so much before the prelim 🙏"],
  cultural:  ["Beautiful exhibition, inspiring.", "Loved the culture night 🎑"],
  career:    ["Great feedback on my resume!", "Mock interview was really useful."],
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const dry = process.env.DRY === '1';
  const { data: completed } = await sb.from('activities')
    .select('id, title, category, start_time, location_coordinates')
    .eq('status', 'completed');
  console.log(`completed activities: ${completed?.length || 0}`);

  let updated = 0, rated = 0;
  for (const a of (completed || [])) {
    const { data: parts } = await sb.from('activity_participants')
      .select('id, user_id, attendance_status, rating')
      .eq('activity_id', a.id)
      .neq('attendance_status', 'cancelled');
    if (!parts || parts.length === 0) continue;

    const startMs = new Date(a.start_time).getTime();
    const fbList = FEEDBACK[a.category] || ["Great event!", "Had a good time."];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      // check-in time: a few minutes after start, jittered
      const checkin = new Date(startMs + (5 + Math.floor(Math.random() * 20)) * 60 * 1000).toISOString();
      // ~85% attended, ~15% no_show for realism
      const noShow = Math.random() < 0.15;
      const update = noShow
        ? { attendance_status: 'no_show' }
        : {
            attendance_status: 'attended',
            checked_in: true,
            checkin_time: checkin,
            location_verified: true,
            distance_from_venue: Math.round(Math.random() * 60), // metres, within 100m radius
            points_earned: 15,
            payment_status: 'paid',
          };
      // ~70% of attendees leave a 1–5 rating (mostly 4–5)
      if (!noShow && Math.random() < 0.7) {
        const r = Math.random() < 0.7 ? 5 : (Math.random() < 0.7 ? 4 : 3);
        update.rating = r;
        update.feedback = pick(fbList);
        rated++;
      }
      if (dry) { console.log(`[dry] ${a.title} <- ${update.attendance_status}${update.rating?` ★${update.rating}`:''}`); continue; }
      const { error } = await sb.from('activity_participants').update(update).eq('id', p.id);
      if (error) { console.log(`ERR ${p.id}: ${error.message}`); continue; }
      updated++;
    }
    console.log(`✅ ${a.title}: processed ${parts.length} participants`);
  }
  console.log(`\nupdated ${updated} participant rows, ${rated} with ratings${dry ? ' (dry)' : ''}`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
