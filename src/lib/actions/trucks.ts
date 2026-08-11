"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { drivers, trucks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const NONE = "none";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(""));

const truckSchema = z.object({
  plate: z.string().min(1).max(20),
  label: z.string().max(120).optional().or(z.literal("")),
  capacityNotes: z.string().optional().or(z.literal("")),
  operatorId: z.string().uuid(),
  defaultDriverId: z.union([
    z.literal(NONE),
    z.literal(""),
    z.string().uuid(),
  ]),
  permisoCirculacionNumber: z.string().max(80).optional().or(z.literal("")),
  permisoCirculacionExpiresAt: optionalDate,
  soapPolicyNumber: z.string().max(80).optional().or(z.literal("")),
  soapInsurer: z.string().max(120).optional().or(z.literal("")),
  soapExpiresAt: optionalDate,
  revisionTecnicaFolio: z.string().max(80).optional().or(z.literal("")),
  revisionTecnicaExpiresAt: optionalDate,
  active: z.boolean(),
});

function emptyToNull(value: string | undefined | null) {
  if (value == null || value === "") return null;
  return value;
}

function parseTruckForm(formData: FormData) {
  return truckSchema.parse({
    plate: formData.get("plate"),
    label: formData.get("label") || "",
    capacityNotes: formData.get("capacityNotes") || "",
    operatorId: formData.get("operatorId"),
    defaultDriverId: formData.get("defaultDriverId") || NONE,
    permisoCirculacionNumber: formData.get("permisoCirculacionNumber") || "",
    permisoCirculacionExpiresAt:
      formData.get("permisoCirculacionExpiresAt") || "",
    soapPolicyNumber: formData.get("soapPolicyNumber") || "",
    soapInsurer: formData.get("soapInsurer") || "",
    soapExpiresAt: formData.get("soapExpiresAt") || "",
    revisionTecnicaFolio: formData.get("revisionTecnicaFolio") || "",
    revisionTecnicaExpiresAt: formData.get("revisionTecnicaExpiresAt") || "",
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
}

async function toRow(parsed: z.infer<typeof truckSchema>) {
  const [operator] = await db
    .select({ id: drivers.id, operatorId: drivers.operatorId })
    .from(drivers)
    .where(eq(drivers.id, parsed.operatorId))
    .limit(1);
  if (!operator || operator.operatorId) {
    throw new Error("Elige un operador válido como dueño del camión.");
  }

  const defaultDriverId =
    !parsed.defaultDriverId || parsed.defaultDriverId === NONE
      ? null
      : parsed.defaultDriverId;

  if (defaultDriverId) {
    const [crew] = await db
      .select({ id: drivers.id, operatorId: drivers.operatorId })
      .from(drivers)
      .where(eq(drivers.id, defaultDriverId))
      .limit(1);
    if (!crew || crew.operatorId !== parsed.operatorId) {
      throw new Error(
        "El conductor habitual debe pertenecer a la flota del operador.",
      );
    }
  }

  return {
    plate: parsed.plate.trim().toUpperCase(),
    label: emptyToNull(parsed.label?.trim()),
    capacityNotes: emptyToNull(parsed.capacityNotes?.trim()),
    operatorId: parsed.operatorId,
    defaultDriverId,
    permisoCirculacionNumber: emptyToNull(
      parsed.permisoCirculacionNumber?.trim(),
    ),
    permisoCirculacionExpiresAt: emptyToNull(
      parsed.permisoCirculacionExpiresAt,
    ),
    soapPolicyNumber: emptyToNull(parsed.soapPolicyNumber?.trim()),
    soapInsurer: emptyToNull(parsed.soapInsurer?.trim()),
    soapExpiresAt: emptyToNull(parsed.soapExpiresAt),
    revisionTecnicaFolio: emptyToNull(parsed.revisionTecnicaFolio?.trim()),
    revisionTecnicaExpiresAt: emptyToNull(parsed.revisionTecnicaExpiresAt),
    active: parsed.active,
  };
}

function revalidateTrucks(id?: string) {
  revalidatePath("/panel/camiones");
  if (id) revalidatePath(`/panel/camiones/${id}`);
}

export async function createTruck(formData: FormData) {
  await requireAdmin();
  const row = await toRow(parseTruckForm(formData));
  await db.insert(trucks).values(row);
  revalidateTrucks();
  redirect("/panel/camiones");
}

export async function updateTruck(id: string, formData: FormData) {
  await requireAdmin();
  const row = await toRow(parseTruckForm(formData));
  await db
    .update(trucks)
    .set({ ...row, updatedAt: new Date() })
    .where(eq(trucks.id, id));
  revalidateTrucks(id);
  redirect(`/panel/camiones/${id}`);
}
