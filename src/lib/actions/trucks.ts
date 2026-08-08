"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { trucks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const truckSchema = z.object({
  plate: z.string().min(1).max(20),
  label: z.string().max(120).optional(),
  capacityNotes: z.string().optional(),
  active: z.boolean(),
});

export async function createTruck(formData: FormData) {
  await requireAdmin();
  const parsed = truckSchema.parse({
    plate: formData.get("plate"),
    label: formData.get("label") || undefined,
    capacityNotes: formData.get("capacityNotes") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  await db.insert(trucks).values(parsed);
  revalidatePath("/panel/camiones");
  redirect("/panel/camiones");
}

export async function updateTruck(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = truckSchema.parse({
    plate: formData.get("plate"),
    label: formData.get("label") || undefined,
    capacityNotes: formData.get("capacityNotes") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  await db
    .update(trucks)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(trucks.id, id));

  revalidatePath("/panel/camiones");
  revalidatePath(`/panel/camiones/${id}`);
  redirect(`/panel/camiones/${id}`);
}
