import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ??

  "postgresql://postgres:postgres@127.0.0.1:5432/neondb";

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("Tables in database:");
  for (const r of rows) console.log(`  ${r.table_name}`);
  console.log("\nRow counts:");
  for (const r of rows) {
    const quoted = `"${r.table_name.replace(/"/g, '""')}"`;
    const res = await client.query(`SELECT count(*)::int AS c FROM ${quoted}`);
    console.log(`  ${r.table_name} = ${res.rows[0].c}`);
  }
  const res = await client.query(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`
  );
  console.log(`\nDB size: ${res.rows[0].size}`);
} finally {
  await client.end();
}