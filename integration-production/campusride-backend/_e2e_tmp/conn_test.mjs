import pg from 'pg';
const pw = process.env.PW || '';
console.log('pw length =', pw.length);
const c = new pg.Client({
  host: 'db.bwimyvkwkenrtumsfjzt.supabase.co',
  port: 5432,
  user: 'postgres',
  password: pw,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
try {
  await c.connect();
  const r = await c.query('select current_user');
  console.log('OK current_user =', r.rows[0].current_user);
} catch (e) {
  console.log('FAIL:', e.message);
} finally {
  try { await c.end(); } catch {}
}
