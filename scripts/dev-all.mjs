import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT, DB_DIR, DB_NAME, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, startDb, stopDb } from "./db.mjs";

const PID_FILE = path.join(DB_DIR, "all.pid");

function runCmd(command, label) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`\n[dev-all] ${label}\n`);
    const child = spawn(command, { cwd: ROOT, shell: true, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function schemaIsSeeded() {
  return new Promise((resolve) => {
    const probe = spawn(
      "node",
      [
        "-e",
        `const pg = require('pg'); (async () => { const c = new pg.Client({ host:'${DB_HOST}', port:${DB_PORT}, user:'${DB_USER}', password:'${DB_PASSWORD}', database:'${DB_NAME}' }); try { await c.connect(); const r = await c.query(\`select coalesce((select count(*) from \\"Product\\"), 0) as n\`); console.log(r.rows[0].n); await c.end(); } catch (e) { console.log('-1'); } })();`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    let out = "";
    probe.stdout.on("data", (d) => (out += d));
    probe.on("close", () => {
      const n = parseInt(out.trim().split(/\r?\n/).pop() ?? "-1", 10);
      resolve(Number.isFinite(n) && n > 0);
    });
    probe.on("error", () => resolve(false));
  });
}

let dbRunning = false;
async function shutdown() {
  if (dbRunning) await stopDb(db);
  process.exit(0);
}
process.on("SIGINT", async () => { process.stdout.write("\n[dev-all] shutting down...\n"); await shutdown(); });
process.on("SIGTERM", async () => { process.stdout.write("\n[dev-all] shutting down...\n"); await shutdown(); });

let db;
try {
  db = await startDb();
  dbRunning = true;
} catch (err) {
  console.error("[dev-all] failed to start the database:", err);
  process.exit(1);
}

try {
  await runCmd("npx prisma db push", "Pushing Prisma schema...");
  const seeded = await schemaIsSeeded();
  if (!seeded) {
    await runCmd("npx prisma db seed", "Seeding database...");
  } else {
    process.stdout.write("[dev-all] database already seeded; skipping seed\n");
  }
} catch (err) {
  console.error("[dev-all] schema/seed step failed:", err);
  await stopDb(db);
  process.exit(1);
}

process.stdout.write("\n[dev-all] starting Next.js dev server on http://localhost:3000 ...\n");
fs.writeFileSync(PID_FILE, String(process.pid));

const next = spawn("npm run dev", { cwd: ROOT, shell: true, stdio: "inherit" });
next.on("error", (err) => {
  console.error("[dev-all] failed to start next:", err);
  void shutdown();
});
next.on("exit", async (code) => {
  process.stdout.write(`[dev-all] next dev exited (${code}); stopping database\n`);
  if (dbRunning) await stopDb(db);
  try { fs.rmSync(PID_FILE); } catch {}
  process.exit(code ?? 0);
});