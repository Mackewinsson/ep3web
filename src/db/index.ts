import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
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
