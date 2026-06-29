import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // temp ratee
  const email = `zzprobe-${Date.now().toString(36)}@cornell.edu`;
  const { data: T, error: ue } = await sb.from('users').insert({
    student_id: email.split('@')[0], email, password_hash: 'x', first_name: 'Probe', last_name: 'Ratee',
    university: 'Cornell University', is_verified: true, verification_status: 'verified'
  }).select('id').single();
  if (ue) { console.log('create temp user FAIL:', ue.message); return; }
  console.log('temp ratee:', T.id);

  // pick a real rater
  const { data: raters } = await sb.from('users').select('id').neq('id', T.id).limit(1);
  const R = raters[0].id;

  // insert a trip rating
  const ins = await sb.from('ratings').insert({
    trip_id: crypto.randomUUID(), rater_id: R, ratee_id: T.id, role_of_rater: 'passenger', score: 4,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).select('id').single();
  console.log('insert ratings row:', ins.error ? 'ERROR ' + ins.error.message : 'ok ' + ins.data.id);

  // replicate recompute queries
  let tripData = null, actThrew = false, actErr = null;
  try { const r = await sb.from('ratings').select('score').eq('ratee_id', T.id); tripData = r.data; if (r.error) console.log('ratings query error:', r.error.message); }
  catch (e) { console.log('ratings query THREW:', e.message); }
  try { const r = await sb.from('activity_ratings').select('score').eq('ratee_id', T.id); actErr = r.error?.message || null; if (r.error) console.log('activity_ratings query returned error:', r.error.message); else console.log('activity_ratings query ok, rows:', (r.data||[]).length); }
  catch (e) { actThrew = true; console.log('activity_ratings query THREW:', e.message); }

  console.log('trip scores:', JSON.stringify(tripData));

  // try the users update
  const scores = (tripData || []).map(r => Number(r.score)).filter(Number.isFinite);
  const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)/100 : null;
  const upd = await sb.from('users').update({ avg_rating: avg, total_ratings: scores.length }).eq('id', T.id).select('avg_rating, total_ratings').single();
  console.log('users update:', upd.error ? 'ERROR ' + upd.error.message : 'ok -> ' + JSON.stringify(upd.data));

  // cleanup
  await sb.from('ratings').delete().eq('ratee_id', T.id);
  await sb.from('users').delete().eq('id', T.id);
  console.log('cleaned up. SUMMARY: activity_ratings ' + (actThrew ? 'THREW (this breaks Promise.all)' : (actErr ? 'returned error (safe)' : 'ok')));
}
main().then(()=>process.exit(0)).catch(e=>{console.error('PROBE ERROR',e);process.exit(1);});
