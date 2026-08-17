"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
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

const acceptSchema = z.object({
  truckId: z.string().uuid(),
  crewDriverId: z.string().uuid(),
  folio: z.string().trim().min(1).max(80),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  originCommune: z.string().trim().min(1).max(120),
  destinationCommune: z.string().trim().min(1).max(120),
  notes: z.string().optional(),
});

function revalidateJobPaths(jobId: string) {
  revalidatePath(`/panel/mis-trabajos/${jobId}`);
  revalidatePath("/panel/mis-trabajos");
  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
}

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
  revalidateJobPaths(jobId);
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

  revalidateJobPaths(jobId);
  redirect(`/panel/trabajos/${jobId}`);
}

export async function assignJob(jobId: string, formData: FormData) {
  await requireAdmin();
  const parsed = assignSchema.parse({
    driverId: formData.get("driverId"),
    notes: formData.get("notes") || undefined,
    scheduledTime: formData.get("scheduledTime") || "",
  });

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    throw new Error("Trabajo no encontrado");
  }

  const [operator] = await db
    .select()
    .from(drivers)
    .where(
      and(
        eq(drivers.id, parsed.driverId),
        isNull(drivers.operatorId),
        eq(drivers.active, true),
      ),
    )
    .limit(1);
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, job.clientId))
    .limit(1);

  if (!operator || !client) {
    throw new Error("Debes asignar un operador activo válido");
  }

  await db.insert(jobAssignments).values({
    jobId,
    driverId: parsed.driverId,
    truckId: null,
    crewDriverId: null,
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
      title: "Asignación sin acceso de operador",
      body: `${operator.name} no tiene usuario de panel vinculado. Activa “Acceso de operador” en Operadores para que reciba notificaciones y vea Mis trabajos.`,
      href: `/panel/conductores/${operator.id}`,
    });
  }

  revalidateJobPaths(jobId);
  redirect(`/panel/trabajos/${jobId}`);
}

async function getLatestOperatorAssignment(jobId: string, operatorId: string) {
  const [latest] = await db
    .select({
      assignmentId: jobAssignments.id,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      crewDriverId: jobAssignments.crewDriverId,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
      status: jobs.status,
    })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
    .where(
      and(
        eq(jobAssignments.jobId, jobId),
        eq(jobAssignments.driverId, operatorId),
      ),
    )
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);
  return latest ?? null;
}

export async function operatorAcceptJob(jobId: string, formData: FormData) {
  const session = await requireDriver();
  const operatorId = session.driverId!;
  const parsed = acceptSchema.parse({
    truckId: formData.get("truckId"),
    crewDriverId: formData.get("crewDriverId"),
    folio: formData.get("folio"),
    issuedAt: formData.get("issuedAt"),
    originCommune: formData.get("originCommune"),
    destinationCommune: formData.get("destinationCommune"),
    notes: formData.get("notes") || undefined,
  });

  const latest = await getLatestOperatorAssignment(jobId, operatorId);
  if (!latest) {
    throw new Error("Trabajo no asignado a este operador");
  }
  if (latest.status !== "assigned") {
    throw new Error("Solo puedes aceptar un trabajo por iniciar");
  }

  const [truck] = await db
    .select()
    .from(trucks)
    .where(
      and(
        eq(trucks.id, parsed.truckId),
        eq(trucks.operatorId, operatorId),
        eq(trucks.active, true),
      ),
    )
    .limit(1);
  if (!truck) {
    throw new Error("Camión no pertenece a tu flota");
  }

  const [crew] = await db
    .select()
    .from(drivers)
    .where(
      and(
        eq(drivers.id, parsed.crewDriverId),
        eq(drivers.operatorId, operatorId),
        eq(drivers.active, true),
      ),
    )
    .limit(1);
  if (!crew) {
    throw new Error("Conductor no pertenece a tu flota");
  }

  await db
    .update(jobAssignments)
    .set({
      truckId: parsed.truckId,
      crewDriverId: parsed.crewDriverId,
      salvoConductoFolio: parsed.folio,
      salvoConductoIssuedAt: parsed.issuedAt,
      salvoConductoOriginCommune: parsed.originCommune,
      salvoConductoDestinationCommune: parsed.destinationCommune,
      salvoConductoNotes: parsed.notes || null,
      salvoConductoCompletedAt: new Date(),
    })
    .where(eq(jobAssignments.id, latest.assignmentId));

  revalidateJobPaths(jobId);
  redirect(`/panel/mis-trabajos/${jobId}`);
}

export async function driverAdvanceJob(
  jobId: string,
  nextStatus: "in_progress" | "completed",
) {
  const session = await requireDriver();
  const operatorId = session.driverId!;

  const latest = await getLatestOperatorAssignment(jobId, operatorId);
  if (!latest) {
    throw new Error("Trabajo no asignado a este operador");
  }

  if (nextStatus === "in_progress" && latest.status !== "assigned") {
    throw new Error("Solo puedes marcar En camino un trabajo por iniciar");
  }
  if (nextStatus === "completed" && latest.status !== "in_progress") {
    throw new Error("Solo puedes finalizar un trabajo en camino");
  }

  if (nextStatus === "in_progress") {
    if (!latest.truckId || !latest.crewDriverId) {
      throw new Error("Debes aceptar el servicio (camión y conductor) primero");
    }
    if (!latest.salvoConductoCompletedAt) {
      throw new Error(
        "Debes registrar el salvo conducto antes de salir en camino",
      );
    }
  }

  await db
    .update(jobs)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  if (nextStatus === "in_progress") {
    await notifyClientEnCaminoForJob(
      jobId,
      latest.crewDriverId,
      latest.truckId,
    );
  }

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

  revalidateJobPaths(jobId);
  redirect(`/panel/mis-trabajos/${jobId}`);
}

async function notifyClientEnCaminoForJob(
  jobId: string,
  crewDriverId: string | null,
  truckId: string | null,
) {
  const [job] = await db
    .select({
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(jobs)
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) return;

  let crewDriverName: string | null = null;
  if (crewDriverId) {
    const [crew] = await db
      .select({ name: drivers.name })
      .from(drivers)
      .where(eq(drivers.id, crewDriverId))
      .limit(1);
    crewDriverName = crew?.name ?? null;
  }

  let truckPlate: string | null = null;
  if (truckId) {
    const [truck] = await db
      .select({ plate: trucks.plate })
      .from(trucks)
      .where(eq(trucks.id, truckId))
      .limit(1);
    truckPlate = truck?.plate ?? null;
  }

  const { notifyClientEnCamino } = await import("@/lib/email/client-en-camino");
  const result = await notifyClientEnCamino({
    clientName: job.clientName,
    clientEmail: job.clientEmail,
    originAddress: job.originAddress,
    destinationAddress: job.destinationAddress,
    crewDriverName,
    truckPlate,
  });

  const { notifyAdmins } = await import("@/lib/notifications");
  await notifyAdmins({
    type: "client_en_camino_email",
    title: result.skipped
      ? "En camino — cliente sin correo (aviso no enviado)"
      : "En camino — aviso al cliente (simulado)",
    body: result.skipped
      ? `${job.clientName}: ${job.originAddress} → ${job.destinationAddress}`
      : `Mock a ${result.to}: ${job.clientName} · ${job.originAddress} → ${job.destinationAddress}`,
    href: `/panel/trabajos/${jobId}`,
  });
}
