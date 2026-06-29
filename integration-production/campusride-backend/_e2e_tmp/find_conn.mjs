import pg from 'pg';
const pw = process.env.PW || '';
const ref = 'bwimyvkwkenrtumsfjzt';
const targets = [
  { label: 'direct',           host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres' },
  { label: 'pooler us-west-1', host: 'aws-0-us-west-1.pooler.supabase.com', port: 6543, user: `postgres.${ref}` },
  { label: 'pooler us-east-1', host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${ref}` },
  { label: 'pooler us-east-2', host: 'aws-0-us-east-2.pooler.supabase.com', port: 6543, user: `postgres.${ref}` },
  { label: 'pooler us-west-1 s', host: 'aws-0-us-west-1.pooler.supabase.com', port: 5432, user: `postgres.${ref}` },
];
for (const t of targets) {
  const c = new pg.Client({ host: t.host, port: t.port, user: t.user, password: pw, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await c.connect();
    const r = await c.query('select current_user');
    console.log(`✅ ${t.label}: CONNECTED as ${r.rows[0].current_user}  [host=${t.host}:${t.port}]`);
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log(`❌ ${t.label}: ${e.message}`);
    try { await c.end(); } catch {}
  }
}
process.exit(2);
