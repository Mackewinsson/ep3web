import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Neon HTTP only speaks to neon.tech. CI and local Postgres use node-postgres. */
function useNodePostgres(url: string) {
  if (process.env.DATABASE_DRIVER === "neon") return false;
  if (process.env.DATABASE_DRIVER === "pg") return true;
  try {
    return !new URL(url).hostname.endsWith("neon.tech");
  } catch {
    return false;
  }
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (useNodePostgres(url)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzlePg } = require("drizzle-orm/node-postgres");
    return drizzlePg(new Pool({ connectionString: url }), { schema }) as Db;
  }
  return drizzle(neon(url), { schema });
}

const globalForDb = globalThis as unknown as {
  ep3Db?: Db;
};

function getDb(): Db {
  if (!globalForDb.ep3Db) {
    globalForDb.ep3Db = createDb();
  }
  return globalForDb.ep3Db;
}

/**
 * Lazy client: importing this module must not throw during `next build`
 * page-data collection. The homepage (and other routes) import `@/db`
 * even when they only query at request time.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
