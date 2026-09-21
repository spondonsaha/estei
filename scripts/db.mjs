import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const DB_DIR = path.join(ROOT, ".localdb");
export const DATA_DIR = path.join(DB_DIR, "data");
const PID_FILE = path.join(DB_DIR, "db.pid");

export const DB_NAME = "neondb";
export const DB_HOST = "127.0.0.1";
export const DB_PORT = 5432;
export const DB_USER = "postgres";
export const DB_PASSWORD = "postgres";

function makePg() {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    authMethod: "password",
    persistent: true,
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
  });
}

function alreadyInitialised() {
  return fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));
}

export async function startDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const pg = makePg();
  if (!alreadyInitialised()) {
    process.stdout.write("[db] initialising data directory...\n");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch (err) {
    if (!String(err?.message ?? err).toLowerCase().includes("already exists")) {
      process.stdout.write(`[db] createDatabase note: ${err?.message ?? err}\n`);
    }
  }
  process.stdout.write(`[db] PostgreSQL ready on ${DB_HOST}:${DB_PORT} (db=${DB_NAME}, user=${DB_USER})\n`);
  return pg;
}

export async function stopDb(pg) {
  if (!pg) return;
  try {
    await pg.stop();
  } catch (err) {
    process.stdout.write(`[db] stop note: ${err?.message ?? err}\n`);
  }
  process.stdout.write("[db] PostgreSQL stopped\n");
  try {
    if (fs.existsSync(PID_FILE)) fs.rmSync(PID_FILE);
  } catch {}
}

async function startForeground() {
  const pg = await startDb();
  fs.writeFileSync(PID_FILE, String(process.pid));
  const shutdown = async () => {
    await stopDb(pg);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function stop() {
  if (!fs.existsSync(PID_FILE)) {
    process.stdout.write("[db] no running db.pid found (nothing to stop)\n");
    return;
  }
  const pid = Number(fs.readFileSync(PID_FILE, "utf8"));
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
  process.stdout.write(r.stdout || r.stderr || `[db] kill signal sent to pid ${pid}\n`);
  try {
    fs.rmSync(PID_FILE);
  } catch {}
}

const isMain = path.basename(process.argv[1] ?? "").toLowerCase() === "db.mjs";

if (isMain) {
  const cmd = process.argv[2] ?? "start";
  if (cmd === "start") {
    await startForeground();
  } else if (cmd === "stop") {
    await stop();
  } else {
    process.stdout.write("usage: node scripts/db.mjs <start|stop>\n");
  }
}