/** Pure job status / readiness rules (no DB). */

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
