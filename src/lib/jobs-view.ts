import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  budgets,
  clients,
  drivers,
  jobAssignments,
  jobs,
  quoteRequests,
  trucks,
} from "@/db/schema";

export async function getDriverAssignedJobs(driverId: string) {
  return db
    .select({
      id: jobs.id,
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      scheduledDate: jobs.scheduledDate,
      scheduledTime: jobs.scheduledTime,
      status: jobs.status,
      notes: jobs.notes,
      clientName: clients.name,
      clientPhone: clients.phone,
      truckPlate: trucks.plate,
      assignmentNotes: jobAssignments.notes,
      assignedAt: jobAssignments.assignedAt,
    })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .innerJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .where(eq(jobAssignments.driverId, driverId))
    .orderBy(desc(jobAssignments.assignedAt));
}

export async function getJobOperationalDetail(jobId: string) {
  const [job] = await db
    .select({
      id: jobs.id,
      originAddress: jobs.originAddress,
      destinationAddress: jobs.destinationAddress,
      scheduledDate: jobs.scheduledDate,
      scheduledTime: jobs.scheduledTime,
      status: jobs.status,
      notes: jobs.notes,
      budgetId: jobs.budgetId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
    })
    .from(jobs)
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) return null;

  let estimatedM3: string | null = null;
  let estimatedItems: number | null = null;
  let volumeNotes: string | null = null;

  if (job.budgetId) {
    const [quote] = await db
      .select({
        estimatedM3: quoteRequests.estimatedM3,
        estimatedItems: quoteRequests.estimatedItems,
        volumeNotes: quoteRequests.volumeNotes,
      })
      .from(budgets)
      .leftJoin(
        quoteRequests,
        eq(budgets.quoteRequestId, quoteRequests.id),
      )
      .where(eq(budgets.id, job.budgetId))
      .limit(1);

    if (quote) {
      estimatedM3 = quote.estimatedM3;
      estimatedItems = quote.estimatedItems;
      volumeNotes = quote.volumeNotes;
    }
  }

  const [assignment] = await db
    .select({
      notes: jobAssignments.notes,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      driverName: drivers.name,
      truckPlate: trucks.plate,
      truckLabel: trucks.label,
      assignedAt: jobAssignments.assignedAt,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .innerJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .where(eq(jobAssignments.jobId, jobId))
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);

  return {
    ...job,
    estimatedM3,
    estimatedItems,
    volumeNotes,
    assignment,
  };
}

export async function assertDriverOwnsJob(jobId: string, driverId: string) {
  const [row] = await db
    .select({ id: jobAssignments.id })
    .from(jobAssignments)
    .where(
      and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.driverId, driverId)),
    )
    .limit(1);
  return Boolean(row);
}

export function mapsUrl(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export function formatVolume(m3: string | null, items: number | null) {
  const parts = [
    m3 ? `${m3} m³` : null,
    items != null ? `${items} ítems` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
