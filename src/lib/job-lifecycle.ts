import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { jobAssignments } from "@/db/schema";
import type { AssignmentEndReason } from "@/lib/job-rules";

export {
  ASSIGNMENT_END_REASONS,
  assertJobStatus,
  isReadyForEnCamino,
  jobIsLocked,
  JOB_STATUSES,
  type AssignmentEndReason,
  type JobStatus,
} from "@/lib/job-rules";

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
