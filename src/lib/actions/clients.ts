"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createClient(formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined,
  });

  await db.insert(clients).values({
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email || null,
    notes: parsed.notes,
  });

  revalidatePath("/panel/clientes");
  redirect("/panel/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined,
  });

  await db
    .update(clients)
    .set({
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/panel/clientes");
  revalidatePath(`/panel/clientes/${id}`);
  redirect(`/panel/clientes/${id}`);
}
