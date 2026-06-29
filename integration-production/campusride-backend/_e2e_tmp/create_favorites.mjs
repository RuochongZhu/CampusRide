// One-off: create item_favorites in prod via direct Postgres connection.
// Usage: PG_CONN="postgresql://...pooler.supabase.com:6543/postgres" node _e2e_tmp/create_favorites.mjs
import pg from 'pg';

const conn = process.env.PG_CONN;
if (!conn) { console.error('PG_CONN env required'); process.exit(1); }

const DDL = `
CREATE TABLE IF NOT EXISTS item_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_item_favorites_user_id ON item_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_item_favorites_item_id ON item_favorites(item_id);
`;

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(DDL);
  const r = await client.query("select count(*)::int as n from item_favorites");
  console.log('✅ item_favorites ready. row count =', r.rows[0].n);
} catch (e) {
  console.error('❌ failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
