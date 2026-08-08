"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  clients,
  drivers,
  jobAssignments,
  jobs,
  trucks,
} from "@/db/schema";
import { requireStaff } from "@/lib/auth";

const assignSchema = z.object({
  driverId: z.string().uuid(),
  truckId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function updateJobStatus(
  jobId: string,
  status:
    | "pending_assignment"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled",
) {
  await requireStaff();
  await db
    .update(jobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
  redirect(`/panel/trabajos/${jobId}`);
}

export async function assignJob(jobId: string, formData: FormData) {
  await requireStaff();
  const parsed = assignSchema.parse({
    driverId: formData.get("driverId"),
    truckId: formData.get("truckId"),
    notes: formData.get("notes") || undefined,
  });

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    throw new Error("Trabajo no encontrado");
  }

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, parsed.driverId))
    .limit(1);
  const [truck] = await db
    .select()
    .from(trucks)
    .where(eq(trucks.id, parsed.truckId))
    .limit(1);
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, job.clientId))
    .limit(1);

  if (!driver || !truck || !client) {
    throw new Error("Datos de asignación incompletos");
  }

  // Resend deferred — email wiring comes later
  await db.insert(jobAssignments).values({
    jobId,
    driverId: parsed.driverId,
    truckId: parsed.truckId,
    notes: parsed.notes,
    emailSentAt: null,
  });

  await db
    .update(jobs)
    .set({ status: "assigned", updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
  redirect(`/panel/trabajos/${jobId}`);
}
