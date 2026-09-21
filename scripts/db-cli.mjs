import pg from "pg";
import readline from "node:readline";
import fs from "node:fs";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/neondb";

const client = new pg.Client({ connectionString: DATABASE_URL });

async function runCmd(raw) {
  const input = raw.trim().replace(/;+$/, "");
  if (!input) return true;
  const lower = input.toLowerCase();
  if (lower === "\\q" || lower === ".exit" || lower === "exit" || lower === "quit") return false;
  if (lower === "\\dt" || lower === "\\l") {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.table(rows.map((r) => ({ table: r.table_name })));
    return true;
  }
  if (lower === "\\d <table>") {
    console.log("Usage: describe <table>");
    return true;
  }
  if (lower.startsWith("\\d ")) {
    const tn = raw.slice(3).trim();
    const { rows } = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [tn]
    );
    console.table(rows);
    return true;
  }
  try {
    const res = await client.query(input);
    if (res.command === "SELECT" || res.command === "SHOW" || res.rows) {
      console.table(res.rows);
      if (res.rows.length) console.log(`(${res.rows.length} rows)`);
    } else {
      console.log(`${res.command} ok: ${res.rowCount} rows affected`);
    }
  } catch (err) {
    console.error(String(err.message ?? err));
  }
  return true;
}

await client.connect();

const arg = process.argv[2];
if (arg) {
  const q = arg === "-f" || arg === "--file" ? fs.readFileSync(process.argv[3], "utf8") : arg;
  const ok = await runCmd(q);
  await client.end();
  process.exit(ok ? 0 : 1);
}

console.log(`Connected to ${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
console.log("Type SQL and press Enter. Commands: \\dt = list tables, \\d <table> = describe, \\q = quit\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = () => rl.setPrompt("sql> ");
prompt();
rl.prompt();
rl.on("line", async (line) => {
  const ok = await runCmd(line);
  if (!ok) {
    rl.close();
    await client.end();
    process.exit(0);
  }
  prompt();
  rl.prompt();
});
rl.on("close", () => {
  client.end();
  process.exit(0);
});