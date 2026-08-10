"use server";

import { and, desc, eq } from "drizzle-orm";
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
import { requireAdmin, requireDriver } from "@/lib/auth";

const assignSchema = z.object({
  driverId: z.string().uuid(),
  truckId: z.string().uuid(),
  notes: z.string().optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
});

const scheduleSchema = z.object({
  scheduledDate: z.string().optional().or(z.literal("")),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
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
  await requireAdmin();
  await db
    .update(jobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
  revalidatePath("/panel/mis-trabajos");
  redirect(`/panel/trabajos/${jobId}`);
}

export async function updateJobSchedule(jobId: string, formData: FormData) {
  await requireAdmin();
  const parsed = scheduleSchema.parse({
    scheduledDate: formData.get("scheduledDate") || "",
    scheduledTime: formData.get("scheduledTime") || "",
    notes: formData.get("notes") || undefined,
  });

  await db
    .update(jobs)
    .set({
      scheduledDate: parsed.scheduledDate || null,
      scheduledTime: parsed.scheduledTime || null,
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel/mis-trabajos");
  redirect(`/panel/trabajos/${jobId}`);
}

export async function assignJob(jobId: string, formData: FormData) {
  await requireAdmin();
  const parsed = assignSchema.parse({
    driverId: formData.get("driverId"),
    truckId: formData.get("truckId"),
    notes: formData.get("notes") || undefined,
    scheduledTime: formData.get("scheduledTime") || "",
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

  await db.insert(jobAssignments).values({
    jobId,
    driverId: parsed.driverId,
    truckId: parsed.truckId,
    notes: parsed.notes,
    emailSentAt: null,
  });

  await db
    .update(jobs)
    .set({
      status: "assigned",
      scheduledTime: parsed.scheduledTime || job.scheduledTime,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  const { notifyAdmins, notifyDriver } = await import("@/lib/notifications");
  const notified = await notifyDriver({
    driverId: parsed.driverId,
    type: "job_assigned",
    title: "Nuevo trabajo asignado",
    body: `${client.name}: ${job.originAddress} → ${job.destinationAddress}`,
    href: `/panel/mis-trabajos/${jobId}`,
  });

  if (!notified) {
    await notifyAdmins({
      type: "driver_no_app_access",
      title: "Asignación sin acceso de camionero",
      body: `${driver.name} no tiene usuario de panel vinculado. Activa “Acceso de camionero” en Conductores para que reciba notificaciones y vea Mis trabajos.`,
      href: `/panel/conductores/${driver.id}`,
    });
  }

  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
  revalidatePath("/panel/mis-trabajos");
  redirect(`/panel/trabajos/${jobId}`);
}

export async function driverAdvanceJob(
  jobId: string,
  nextStatus: "in_progress" | "completed",
) {
  const session = await requireDriver();
  const driverId = session.driverId!;

  const [latest] = await db
    .select({
      assignmentId: jobAssignments.id,
      driverId: jobAssignments.driverId,
      status: jobs.status,
    })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
    .where(
      and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.driverId, driverId)),
    )
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);

  if (!latest) {
    throw new Error("Trabajo no asignado a este conductor");
  }

  if (nextStatus === "in_progress" && latest.status !== "assigned") {
    throw new Error("Solo puedes marcar En camino un trabajo por iniciar");
  }
  if (nextStatus === "completed" && latest.status !== "in_progress") {
    throw new Error("Solo puedes finalizar un trabajo en camino");
  }

  await db
    .update(jobs)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  if (nextStatus === "completed") {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const { notifyAdmins } = await import("@/lib/notifications");
    await notifyAdmins({
      type: "job_completed",
      title: "Trabajo completado",
      body: job
        ? `${job.originAddress} → ${job.destinationAddress}`
        : `Trabajo ${jobId}`,
      href: `/panel/trabajos/${jobId}`,
    });
  }

  revalidatePath(`/panel/mis-trabajos/${jobId}`);
  revalidatePath("/panel/mis-trabajos");
  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
  redirect(`/panel/mis-trabajos/${jobId}`);
}
