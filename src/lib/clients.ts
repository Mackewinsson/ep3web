import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";

export async function upsertClientByContact(input: {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}): Promise<string> {
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;
  const name = input.name.trim();

  const matchConditions = [];
  if (phone) matchConditions.push(eq(clients.phone, phone));
  if (email) matchConditions.push(eq(clients.email, email));

  if (matchConditions.length > 0) {
    const [existing] = await db
      .select()
      .from(clients)
      .where(or(...matchConditions))
      .limit(1);
    if (existing) {
      await db
        .update(clients)
        .set({
          name,
          phone,
          email,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, existing.id));
      return existing.id;
    }
  }

  const [created] = await db
    .insert(clients)
    .values({
      name,
      phone,
      email,
      notes: input.notes ?? null,
    })
    .returning();

  return created.id;
}
