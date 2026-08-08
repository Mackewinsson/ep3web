import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

const globalForDb = globalThis as unknown as {
  ep3Db?: ReturnType<typeof createDb>;
};

export const db = globalForDb.ep3Db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.ep3Db = db;
}
