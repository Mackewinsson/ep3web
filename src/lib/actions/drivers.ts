"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const driverSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  licenseNotes: z.string().optional(),
  active: z.boolean(),
  appPassword: z.string().min(6).optional().or(z.literal("")),
  enableAppAccess: z.boolean(),
});

function parseDriverForm(formData: FormData) {
  return driverSchema.parse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    phone: formData.get("phone") || undefined,
    licenseNotes: formData.get("licenseNotes") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
    appPassword: formData.get("appPassword") || "",
    enableAppAccess:
      formData.get("enableAppAccess") === "on" ||
      formData.get("enableAppAccess") === "true",
  });
}

async function syncDriverLogin(
  driverId: string,
  data: z.infer<typeof driverSchema>,
) {
  const [existingLogin] = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.driverId, driverId))
    .limit(1);

  if (!data.enableAppAccess) {
    if (existingLogin) {
      await db
        .update(staffUsers)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(staffUsers.id, existingLogin.id));
    }
    return;
  }

  const password = data.appPassword?.trim();
  if (!existingLogin && (!password || password.length < 6)) {
    throw new Error(
      "Para activar el acceso de camionero indica una contraseña de al menos 6 caracteres.",
    );
  }

  if (existingLogin) {
    const patch: {
      email: string;
      name: string;
      active: boolean;
      updatedAt: Date;
      passwordHash?: string;
    } = {
      email: data.email,
      name: data.name,
      active: true,
      updatedAt: new Date(),
    };
    if (password && password.length >= 6) {
      patch.passwordHash = await bcrypt.hash(password, 12);
    }
    await db
      .update(staffUsers)
      .set(patch)
      .where(eq(staffUsers.id, existingLogin.id));
    return;
  }

  // Email might already be used by another staff user
  const [emailTaken] = await db
    .select({ id: staffUsers.id, driverId: staffUsers.driverId })
    .from(staffUsers)
    .where(eq(staffUsers.email, data.email))
    .limit(1);

  if (emailTaken && emailTaken.driverId !== driverId) {
    throw new Error("Ese correo ya tiene una cuenta de acceso.");
  }

  const passwordHash = await bcrypt.hash(password!, 12);
  await db.insert(staffUsers).values({
    email: data.email,
    name: data.name,
    passwordHash,
    role: "driver",
    driverId,
    active: true,
  });
}

export async function createDriver(formData: FormData) {
  await requireAdmin();
  const parsed = parseDriverForm(formData);

  const [driver] = await db
    .insert(drivers)
    .values({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      licenseNotes: parsed.licenseNotes,
      active: parsed.active,
    })
    .returning();

  if (parsed.enableAppAccess) {
    await syncDriverLogin(driver.id, parsed);
  }

  revalidatePath("/panel/conductores");
  redirect("/panel/conductores");
}

export async function updateDriver(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseDriverForm(formData);

  await db
    .update(drivers)
    .set({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      licenseNotes: parsed.licenseNotes,
      active: parsed.active,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, id));

  await syncDriverLogin(id, parsed);

  revalidatePath("/panel/conductores");
  revalidatePath(`/panel/conductores/${id}`);
  redirect(`/panel/conductores/${id}`);
}
