"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { drivers, staffUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const NONE = "none";

const driverSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  licenseNotes: z.string().optional(),
  active: z.boolean(),
  /** operator = flota dueña; crew = conductor bajo un operador */
  kind: z.enum(["operator", "crew"]),
  operatorId: z.union([
    z.literal(NONE),
    z.literal(""),
    z.string().uuid(),
  ]),
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
    kind: formData.get("kind") || "operator",
    operatorId: formData.get("operatorId") || NONE,
    appPassword: formData.get("appPassword") || "",
    enableAppAccess:
      formData.get("enableAppAccess") === "on" ||
      formData.get("enableAppAccess") === "true",
  });
}

function resolveOperatorId(parsed: z.infer<typeof driverSchema>) {
  if (parsed.kind !== "crew") return null;
  if (!parsed.operatorId || parsed.operatorId === NONE) {
    throw new Error("Elige el operador dueño para un conductor de flota.");
  }
  return parsed.operatorId;
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

  // Solo operadores usan acceso app; conductores de flota no
  if (data.kind === "crew" || !data.enableAppAccess) {
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
      "Para activar el acceso de operador indica una contraseña de al menos 6 caracteres.",
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

  const [emailTaken] = await db
    .select({
      id: staffUsers.id,
      driverId: staffUsers.driverId,
      role: staffUsers.role,
    })
    .from(staffUsers)
    .where(eq(staffUsers.email, data.email))
    .limit(1);

  if (emailTaken) {
    if (emailTaken.role !== "driver") {
      throw new Error("Ese correo ya tiene una cuenta de acceso (admin).");
    }
    if (emailTaken.driverId && emailTaken.driverId !== driverId) {
      throw new Error("Ese correo ya tiene una cuenta de acceso.");
    }
    const passwordHash = await bcrypt.hash(password!, 12);
    await db
      .update(staffUsers)
      .set({
        name: data.name,
        passwordHash,
        driverId,
        active: true,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, emailTaken.id));
    return;
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
  const operatorId = resolveOperatorId(parsed);

  if (operatorId) {
    const [owner] = await db
      .select({ id: drivers.id, operatorId: drivers.operatorId })
      .from(drivers)
      .where(eq(drivers.id, operatorId))
      .limit(1);
    if (!owner || owner.operatorId) {
      throw new Error("El operador dueño no es válido.");
    }
  }

  const [driver] = await db
    .insert(drivers)
    .values({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      licenseNotes: parsed.licenseNotes,
      operatorId,
      active: parsed.active,
    })
    .returning();

  if (parsed.kind === "operator" && parsed.enableAppAccess) {
    await syncDriverLogin(driver.id, parsed);
  }

  revalidatePath("/panel/conductores");
  redirect("/panel/conductores");
}

export async function updateDriver(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseDriverForm(formData);
  const operatorId = resolveOperatorId(parsed);

  if (operatorId === id) {
    throw new Error("Un conductor no puede ser su propio operador.");
  }

  if (operatorId) {
    const [owner] = await db
      .select({ id: drivers.id, operatorId: drivers.operatorId })
      .from(drivers)
      .where(eq(drivers.id, operatorId))
      .limit(1);
    if (!owner || owner.operatorId) {
      throw new Error("El operador dueño no es válido.");
    }
  }

  await db
    .update(drivers)
    .set({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      licenseNotes: parsed.licenseNotes,
      operatorId,
      active: parsed.active,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, id));

  await syncDriverLogin(id, parsed);

  revalidatePath("/panel/conductores");
  revalidatePath(`/panel/conductores/${id}`);
  redirect(`/panel/conductores/${id}`);
}
