import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const H = 3600 * 1000, D = 24 * H;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

// ONGOING NOW (start<=now<=end) — these drive the "live" map markers
const ONGOING = {
  '4d3a77b8-250e-4228-b23e-aa9f8917c804': { start: now - 10 * D, end: now + 15 * D }, // 30-Day Fitness Challenge (multi-day)
  '61777527-3d79-4043-a1bb-73d01e197bca': { start: now - 5 * D,  end: now + 12 * D }, // Cornell Art Exhibition (multi-day)
  '2bb56399-73f6-46c5-a8d8-0187515a8ec9': { start: now - 2 * H,  end: now + 4 * H  }, // Board Game Marathon (today)
  '350a0e5d-f6e6-4256-8f9d-1205e0c8e772': { start: now - 1 * H,  end: now + 2 * H  }, // 5K Fun Run at Beebe Lake (today)
};

// UPCOMING (start in the future) — keep original duration, shift date
const UPCOMING = {
  '3b0dbbe9-0814-4619-bf5c-2a84403a5b73': 1,   // Study Session: Econ 1110
  'bfcf6995-b3ce-4654-9cdc-6e5c861f60ac': 2,   // Resume Review & Mock Interviews
  '216d8098-afa8-49b5-850a-75ff3bc81159': 3,   // Intro to ML Workshop
  '4de93081-c9d4-43af-a139-2ddc65bfb6d1': 4,   // Gorge Trail Hike
  '5044c40f-d3bb-46fe-a87b-b0ae16d8389e': 5,   // Volunteering at Ithaca Food Bank
  'bb7b33d8-b6de-4e5d-a4cd-ff5660e4b9b9': 6,   // Japanese Culture Night
  '6145bce3-3cbe-4f12-bbef-7dfc4499544f': 8,   // Photography Walk
  '1c836411-3dfa-4fe1-b1ec-311d8ac84068': 10,  // Basketball 3v3
  '1f769217-910f-40fa-b8fb-61c60197eb4d': 12,  // Startup Pitch Night
  'b07e03b5-0580-4640-a9b2-a659bc188385': 15,  // Python Coding Challenge
};

const FEEDBACK = [
  'Had a great time, well organized!', 'Really enjoyed this, would come again.',
  'Fun event and met some cool people.', 'Great vibe, thanks for organizing!',
  'Learned a lot, the organizer was super helpful.', 'Solid event, ran a bit long but worth it.',
  'Loved it! Hope they do another one soon.', 'Awesome turnout, great energy.',
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function main() {
  const dry = process.env.DRY === '1';
  const { data: acts } = await sb.from('activities').select('id, title, status, start_time, end_time');
  const byId = Object.fromEntries(acts.map(a => [a.id, a]));

  // 1) ONGOING
  for (const [id, w] of Object.entries(ONGOING)) {
    const a = byId[id]; if (!a) { console.log('missing', id); continue; }
    const upd = { start_time: iso(w.start), end_time: iso(w.end), status: 'ongoing', registration_deadline: iso(w.start - 1 * D), updated_at: iso(now) };
    console.log(`ONGOING  ${a.title} -> ${upd.start_time} .. ${upd.end_time}`);
    if (!dry) await sb.from('activities').update(upd).eq('id', id);
  }

  // 2) UPCOMING (preserve duration, evening start)
  for (const [id, offsetDays] of Object.entries(UPCOMING)) {
    const a = byId[id]; if (!a) { console.log('missing', id); continue; }
    const durMs = Math.max(2 * H, new Date(a.end_time) - new Date(a.start_time));
    const start = new Date(now + offsetDays * D); start.setHours(18, 0, 0, 0);
    const end = new Date(start.getTime() + durMs);
    const upd = { start_time: start.toISOString(), end_time: end.toISOString(), status: 'published', registration_deadline: iso(start.getTime() - 1 * D), updated_at: iso(now) };
    console.log(`UPCOMING ${a.title} -> ${upd.start_time}`);
    if (!dry) await sb.from('activities').update(upd).eq('id', id);
  }

  // 3) Enrich participation history: attended participants of COMPLETED activities get a rating + feedback
  const { data: completed } = await sb.from('activities').select('id, title, reward_points').eq('status', 'completed');
  let rated = 0;
  for (const a of (completed || [])) {
    const { data: parts } = await sb.from('activity_participants')
      .select('id, attendance_status, rating, points_earned')
      .eq('activity_id', a.id).eq('attendance_status', 'attended');
    for (const p of (parts || [])) {
      if (p.rating != null) continue;
      const score = Math.random() < 0.7 ? 5 : (Math.random() < 0.6 ? 4 : 3);
      const upd = { rating: score, feedback: pick(FEEDBACK), payment_status: 'paid', updated_at: iso(now) };
      if (!p.points_earned) upd.points_earned = a.reward_points || 10;
      if (!dry) await sb.from('activity_participants').update(upd).eq('id', p.id);
      rated++;
    }
  }
  console.log(`\nRatings/feedback added to ${rated} attended participants${dry ? ' (dry run)' : ''}.`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
