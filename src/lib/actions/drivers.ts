"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { requireStaff } from "@/lib/auth";

const driverSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  licenseNotes: z.string().optional(),
  active: z.boolean(),
});

export async function createDriver(formData: FormData) {
  await requireStaff();
  const parsed = driverSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    licenseNotes: formData.get("licenseNotes") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  await db.insert(drivers).values(parsed);
  revalidatePath("/panel/conductores");
  redirect("/panel/conductores");
}

export async function updateDriver(id: string, formData: FormData) {
  await requireStaff();
  const parsed = driverSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    licenseNotes: formData.get("licenseNotes") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  await db
    .update(drivers)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(drivers.id, id));

  revalidatePath("/panel/conductores");
  revalidatePath(`/panel/conductores/${id}`);
  redirect(`/panel/conductores/${id}`);
}
