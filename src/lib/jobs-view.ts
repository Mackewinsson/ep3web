import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
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
import { getOpenAssignment, jobIsLocked } from "@/lib/job-lifecycle";
import { getPricingConfig } from "@/lib/moving-catalog-db";
import {
  operatorPayoutFromQuoteSources,
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
      volumeNotes: quoteRequests.volumeNotes,
      estimatedM3: quoteRequests.estimatedM3,
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
    .leftJoin(quoteRequests, eq(budgets.quoteRequestId, quoteRequests.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .leftJoin(crewDrivers, eq(jobAssignments.crewDriverId, crewDrivers.id))
    .where(
      and(
        eq(jobAssignments.driverId, driverId),
        or(
          and(
            isNull(jobAssignments.endedAt),
            inArray(jobs.status, ["assigned", "in_progress"]),
          ),
          inArray(jobs.status, ["completed", "cancelled"]),
        ),
      ),
    )
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
      crewDriverRut: jobAssignments.crewDriverRut,
    })
    .from(jobAssignments)
    .innerJoin(drivers, eq(jobAssignments.driverId, drivers.id))
    .leftJoin(trucks, eq(jobAssignments.truckId, trucks.id))
    .leftJoin(crewDrivers, eq(jobAssignments.crewDriverId, crewDrivers.id))
    .where(
      and(eq(jobAssignments.jobId, jobId), isNull(jobAssignments.endedAt)),
    )
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

export function operatorPayoutForAssignedJob(
  row: {
    clientTotalAmount?: string | null;
    volumeNotes?: string | null;
    notes?: string | null;
    estimatedM3?: string | null;
  },
  pricing: { operatorMarginPercent: number; pricePerM3: number },
) {
  return operatorPayoutFromQuoteSources(
    {
      budgetTotal: row.clientTotalAmount,
      notes: [row.volumeNotes, row.notes].filter(Boolean).join("\n"),
      estimatedM3: row.estimatedM3,
      pricePerM3: pricing.pricePerM3,
    },
    pricing.operatorMarginPercent,
  );
}

export async function operatorFacingAmounts(
  clientTotalAmount: string | null,
  fallback?: {
    volumeNotes?: string | null;
    jobNotes?: string | null;
    estimatedM3?: string | null;
  },
) {
  const cfg = await getPricingConfig();
  const payout = operatorPayoutForAssignedJob(
    {
      clientTotalAmount,
      volumeNotes: fallback?.volumeNotes,
      notes: fallback?.jobNotes,
      estimatedM3: fallback?.estimatedM3,
    },
    cfg,
  );
  return {
    operatorPayout: payout,
    marginPercent: cfg.operatorMarginPercent,
  };
}

export function operatorSafeNotes(notes: string | null | undefined) {
  return stripClientPriceLines(notes);
}

export { isReadyForEnCamino } from "@/lib/job-lifecycle";

export async function assertDriverOwnsJob(jobId: string, driverId: string) {
  const open = await getOpenAssignment(jobId);
  if (open?.driverId === driverId) return true;

  const [job] = await db
    .select({ status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!job || !jobIsLocked(job.status)) return false;

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
