import "dotenv/config";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { staffUsers } from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const email = (
    process.env.ADMIN_EMAIL ?? "admin@transportesep3.cl"
  ).toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ep3admin123";
  const name = process.env.ADMIN_NAME ?? "Admin EP3";

  const sql = neon(url);
  const db = drizzle(sql);

  const [existing] = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.email, email))
    .limit(1);

  if (existing) {
    console.log(`Staff user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(staffUsers).values({
    email,
    name,
    passwordHash,
    active: true,
  });

  console.log(`Created staff user: ${email}`);
  console.log("Use ADMIN_PASSWORD from env (or default) to sign in.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
