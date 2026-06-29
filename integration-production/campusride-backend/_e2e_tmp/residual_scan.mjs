import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Scan for any leftover E2E test rows (markers: ZZE2E or e2e_ in text fields).
async function scan(table, col, pat) {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true }).ilike(col, pat);
  if (error) return `${table}.${col}: (err ${error.code})`;
  return `${table}.${col} ~ '${pat}': ${count}`;
}
async function main() {
  const checks = [
    ['users', 'email', '%zze2e%'], ['users', 'email', '%e2e_%'],
    ['groups', 'name', '%ZZE2E%'], ['group_messages', 'content', '%ZZE2E%'],
    ['marketplace_items', 'title', '%ZZE2E%'], ['marketplace_comments', 'content', '%ZZE2E%'],
    ['rides', 'title', '%ZZE2E%'], ['messages', 'subject', '%ZZE2E%'],
    ['activities', 'title', '%ZZE2E%'], ['wxgroup_notice_record', 'content', '%ZZE2E%'],
  ];
  for (const [t, c, p] of checks) console.log(' ', await scan(t, c, p));
  // baseline sanity: real content still present
  const { count: gm } = await sb.from('group_messages').select('*', { count: 'exact', head: true });
  const { count: gp } = await sb.from('groups').select('*', { count: 'exact', head: true });
  const { count: ap } = await sb.from('activity_participants').select('*', { count: 'exact', head: true });
  console.log(`\nbaseline kept: group_messages=${gm}, groups=${gp}, activity_participants=${ap}`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
