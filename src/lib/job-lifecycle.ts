import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { jobAssignments } from "@/db/schema";

export const ASSIGNMENT_END_REASONS = [
  "declined",
  "reassigned",
  "cancelled",
] as const;

export type AssignmentEndReason = (typeof ASSIGNMENT_END_REASONS)[number];

export const JOB_STATUSES = [
  "pending_assignment",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export function jobIsLocked(status: string) {
  return status === "completed" || status === "cancelled";
}

export function assertJobStatus(
  status: string,
  allowed: readonly string[],
  message: string,
) {
  if (!allowed.includes(status)) {
    throw new Error(message);
  }
}

export async function getOpenAssignment(jobId: string) {
  const [row] = await db
    .select()
    .from(jobAssignments)
    .where(
      and(eq(jobAssignments.jobId, jobId), isNull(jobAssignments.endedAt)),
    )
    .orderBy(desc(jobAssignments.assignedAt))
    .limit(1);
  return row ?? null;
}

export async function endOpenAssignment(
  jobId: string,
  reason: AssignmentEndReason,
) {
  const open = await getOpenAssignment(jobId);
  if (!open) return null;
  await db
    .update(jobAssignments)
    .set({ endedAt: new Date(), endReason: reason })
    .where(eq(jobAssignments.id, open.id));
  return open;
}

export function isReadyForEnCamino(assignment: {
  truckId: string | null;
  crewDriverId: string | null;
  crewDriverRut?: string | null;
  salvoConductoCompletedAt: Date | null;
} | null) {
  return Boolean(
    assignment?.truckId &&
      assignment?.crewDriverId &&
      assignment?.crewDriverRut &&
      assignment?.salvoConductoCompletedAt,
  );
}
