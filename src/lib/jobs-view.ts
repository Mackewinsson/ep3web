import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
import { getPricingConfig } from "@/lib/moving-catalog-db";
import {
  operatorPayoutFromClientTotal,
  stripClientPriceLines,
} from "@/lib/quote-pricing";

const crewDrivers = alias(drivers, "crew_drivers");

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
      clientTotalAmount: budgets.totalAmount,
      truckPlate: trucks.plate,
      crewDriverName: crewDrivers.name,
      assignmentNotes: jobAssignments.notes,
      assignedAt: jobAssignments.assignedAt,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
    })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
    .innerJoin(clients, eq(jobs.clientId, clients.id))
    .leftJoin(budgets, eq(jobs.budgetId, budgets.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .leftJoin(crewDrivers, eq(jobAssignments.crewDriverId, crewDrivers.id))
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
  let clientTotalAmount: string | null = null;

  if (job.budgetId) {
    const [quote] = await db
      .select({
        estimatedM3: quoteRequests.estimatedM3,
        estimatedItems: quoteRequests.estimatedItems,
        volumeNotes: quoteRequests.volumeNotes,
        totalAmount: budgets.totalAmount,
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
      clientTotalAmount = quote.totalAmount;
    }
  }

  const [assignment] = await db
    .select({
      id: jobAssignments.id,
      notes: jobAssignments.notes,
      driverId: jobAssignments.driverId,
      truckId: jobAssignments.truckId,
      crewDriverId: jobAssignments.crewDriverId,
      driverName: drivers.name,
      crewDriverName: crewDrivers.name,
      truckPlate: trucks.plate,
      truckLabel: trucks.label,
      assignedAt: jobAssignments.assignedAt,
      salvoConductoFolio: jobAssignments.salvoConductoFolio,
      salvoConductoIssuedAt: jobAssignments.salvoConductoIssuedAt,
      salvoConductoOriginCommune: jobAssignments.salvoConductoOriginCommune,
      salvoConductoDestinationCommune:
        jobAssignments.salvoConductoDestinationCommune,
      salvoConductoNotes: jobAssignments.salvoConductoNotes,
      salvoConductoCompletedAt: jobAssignments.salvoConductoCompletedAt,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .leftJoin(crewDrivers, eq(jobAssignments.crewDriverId, crewDrivers.id))
    .where(eq(jobAssignments.jobId, jobId))
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);

  return {
    ...job,
    estimatedM3,
    estimatedItems,
    volumeNotes,
    clientTotalAmount,
    assignment: assignment ?? null,
  };
}

export async function getOperatorMarginPercent() {
  const cfg = await getPricingConfig();
  return cfg.operatorMarginPercent;
}

export async function operatorFacingAmounts(clientTotalAmount: string | null) {
  const marginPercent = await getOperatorMarginPercent();
  const clientTotal = Number(clientTotalAmount);
  const payout =
    clientTotalAmount != null && Number.isFinite(clientTotal) && clientTotal > 0
      ? operatorPayoutFromClientTotal(clientTotal, marginPercent)
      : null;
  return {
    operatorPayout: payout,
    marginPercent,
  };
}

export function operatorSafeNotes(notes: string | null | undefined) {
  return stripClientPriceLines(notes);
}

export function isReadyForEnCamino(assignment: {
  truckId: string | null;
  crewDriverId: string | null;
  salvoConductoCompletedAt: Date | null;
} | null) {
  return Boolean(
    assignment?.truckId &&
      assignment?.crewDriverId &&
      assignment?.salvoConductoCompletedAt,
  );
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

export function formatVolume(
  estimatedM3: string | null,
  estimatedItems: number | null,
) {
  const parts: string[] = [];
  if (estimatedM3) parts.push(`${estimatedM3} m³`);
  if (estimatedItems != null) parts.push(`${estimatedItems} ítems`);
  return parts.length ? parts.join(" · ") : null;
}

export function mapsUrl(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}
