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
    process.env.OPERATOR_EMAIL ?? "camionero@transportesep3.cl"
  ).toLowerCase();
  const password = process.env.OPERATOR_PASSWORD ?? "ep3op123456";

  const db = drizzle(neon(url));
  const passwordHash = await bcrypt.hash(password, 12);

  const [updated] = await db
    .update(staffUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(staffUsers.email, email))
    .returning({
      email: staffUsers.email,
      name: staffUsers.name,
      role: staffUsers.role,
    });

  if (!updated) {
    throw new Error(`No staff user found for ${email}`);
  }

  console.log(`Password reset for ${updated.role} ${updated.name} <${updated.email}>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
