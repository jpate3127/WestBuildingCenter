import { mkdirSync } from "node:fs";
import { join } from "node:path";

import EmbeddedPostgres from "embedded-postgres";

/**
 * A throwaway Postgres for local development when there is no Docker or
 * installed Postgres: `npm run db:local`, then point DATABASE_URL at the
 * printed URL (it matches .env.example). Data lives in data/pg/ and survives
 * restarts. Stop with Ctrl+C. Production uses Railway's Postgres instead.
 */

const PORT = Number(process.env.LOCAL_PG_PORT ?? 5434);
const dir = join(process.cwd(), "data", "pg");
mkdirSync(dir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  onLog: () => undefined,
  onError: (message) => console.error(String(message)),
});

async function main() {
  try {
    await pg.initialise();
    console.log("[db:local] initialised a new data directory");
  } catch {
    // Already initialised.
  }
  await pg.start();
  try {
    await pg.createDatabase("wbc");
    console.log("[db:local] created database wbc");
  } catch {
    // Exists.
  }
  console.log(`[db:local] ready: postgresql://postgres:postgres@localhost:${PORT}/wbc`);
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
