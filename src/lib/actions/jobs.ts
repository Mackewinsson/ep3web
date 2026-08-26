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
import {
  assertJobStatus,
  endOpenAssignment,
  getOpenAssignment,
  isReadyForEnCamino,
  jobIsLocked,
} from "@/lib/job-lifecycle";

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
  crewDriverRut: z
    .string()
    .trim()
    .min(8, "RUT inválido")
    .max(20)
    .regex(/^[0-9.\-kK]+$/, "RUT inválido"),
});

function revalidateJobPaths(jobId: string) {
  revalidatePath(`/panel/mis-trabajos/${jobId}`);
  revalidatePath("/panel/mis-trabajos");
  revalidatePath(`/panel/trabajos/${jobId}`);
  revalidatePath("/panel/trabajos");
  revalidatePath("/panel");
}

async function requireJob(jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    throw new Error("Trabajo no encontrado");
  }
  return job;
}

export async function updateJobStatus(
  jobId: string,
  status: "in_progress" | "completed" | "cancelled",
) {
  await requireAdmin();
  const job = await requireJob(jobId);
  if (jobIsLocked(job.status)) {
    throw new Error("Este trabajo ya está cerrado");
  }

  if (status === "cancelled") {
    assertJobStatus(
      job.status,
      ["pending_assignment", "assigned", "in_progress"],
      "No se puede cancelar este trabajo",
    );
    const previous = await endOpenAssignment(jobId, "cancelled");
    await db
      .update(jobs)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
    if (previous) {
      const { notifyDriver } = await import("@/lib/notifications");
      await notifyDriver({
        driverId: previous.driverId,
        type: "job_cancelled",
        title: "Trabajo cancelado",
        body: `${job.originAddress} → ${job.destinationAddress}`,
        href: `/panel/mis-trabajos/${jobId}`,
      });
    }
    revalidateJobPaths(jobId);
    redirect(`/panel/trabajos/${jobId}`);
  }

  if (status === "in_progress") {
    assertJobStatus(
      job.status,
      ["assigned"],
      "Solo puedes marcar En camino un trabajo asignado",
    );
    const open = await getOpenAssignment(jobId);
    if (!isReadyForEnCamino(open)) {
      throw new Error(
        "El operador debe registrar chofer, RUT y patente primero",
      );
    }
  }

  if (status === "completed") {
    assertJobStatus(
      job.status,
      ["in_progress"],
      "Solo puedes finalizar un trabajo en camino",
    );
  }

  await db
    .update(jobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
  revalidateJobPaths(jobId);
  redirect(`/panel/trabajos/${jobId}`);
}

export async function updateJobSchedule(jobId: string, formData: FormData) {
  await requireAdmin();
  const job = await requireJob(jobId);
  if (jobIsLocked(job.status)) {
    throw new Error("No se puede editar un trabajo finalizado o cancelado");
  }
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

  const job = await requireJob(jobId);
  if (jobIsLocked(job.status)) {
    throw new Error("No se puede asignar un trabajo cerrado");
  }
  assertJobStatus(
    job.status,
    ["pending_assignment", "assigned"],
    "Solo puedes asignar un trabajo pendiente o asignado",
  );

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

  const previous = await endOpenAssignment(jobId, "reassigned");

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
  if (previous && previous.driverId !== parsed.driverId) {
    await notifyDriver({
      driverId: previous.driverId,
      type: "job_unassigned",
      title: "Trabajo reasignado",
      body: "Este trabajo fue reasignado a otro operador.",
      href: "/panel/mis-trabajos",
    });
  }

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

async function getOpenOperatorAssignment(jobId: string, operatorId: string) {
  const [latest] = await db
    .select({
      assignmentId: jobAssignments.id,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      crewDriverId: jobAssignments.crewDriverId,
      crewDriverRut: jobAssignments.crewDriverRut,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
      status: jobs.status,
    })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
    .where(
      and(
        eq(jobAssignments.jobId, jobId),
        eq(jobAssignments.driverId, operatorId),
        isNull(jobAssignments.endedAt),
      ),
    )
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);
  return latest ?? null;
}

export async function operatorDeclineJob(jobId: string) {
  const session = await requireDriver();
  const operatorId = session.driverId!;
  const job = await requireJob(jobId);
  assertJobStatus(
    job.status,
    ["assigned"],
    "Solo puedes rechazar un trabajo por iniciar",
  );

  const latest = await getOpenOperatorAssignment(jobId, operatorId);
  if (!latest) {
    throw new Error("Trabajo no asignado a este operador");
  }
  if (isReadyForEnCamino(latest)) {
    throw new Error(
      "Ya aceptaste este servicio. Pide a administración que lo cancele.",
    );
  }

  await endOpenAssignment(jobId, "declined");
  await db
    .update(jobs)
    .set({ status: "pending_assignment", updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  const { notifyAdmins } = await import("@/lib/notifications");
  await notifyAdmins({
    type: "job_declined",
    title: "Operador rechazó un trabajo",
    body: `${job.originAddress} → ${job.destinationAddress}`,
    href: `/panel/trabajos/${jobId}`,
  });

  revalidateJobPaths(jobId);
  redirect("/panel/mis-trabajos");
}

export async function operatorAcceptJob(jobId: string, formData: FormData) {
  const session = await requireDriver();
  const operatorId = session.driverId!;
  const parsed = acceptSchema.parse({
    truckId: formData.get("truckId"),
    crewDriverId: formData.get("crewDriverId"),
    crewDriverRut: formData.get("crewDriverRut"),
  });

  const latest = await getOpenOperatorAssignment(jobId, operatorId);
  if (!latest) {
    throw new Error("Trabajo no asignado a este operador");
  }
  if (jobIsLocked(latest.status) || latest.status !== "assigned") {
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
      crewDriverRut: parsed.crewDriverRut.toUpperCase(),
      salvoConductoFolio: null,
      salvoConductoIssuedAt: null,
      salvoConductoOriginCommune: null,
      salvoConductoDestinationCommune: null,
      salvoConductoNotes: null,
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

  const latest = await getOpenOperatorAssignment(jobId, operatorId);
  if (!latest) {
    throw new Error("Trabajo no asignado a este operador");
  }
  if (jobIsLocked(latest.status)) {
    throw new Error("Este trabajo ya está cerrado");
  }

  if (nextStatus === "in_progress" && latest.status !== "assigned") {
    throw new Error("Solo puedes marcar En camino un trabajo por iniciar");
  }
  if (nextStatus === "completed" && latest.status !== "in_progress") {
    throw new Error("Solo puedes finalizar un trabajo en camino");
  }

  if (nextStatus === "in_progress" && !isReadyForEnCamino(latest)) {
    throw new Error(
      "Debes registrar chofer, RUT y patente antes de salir en camino",
    );
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
