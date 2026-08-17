ALTER TABLE "job_assignments" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "end_reason" varchar(40);--> statement-breakpoint
UPDATE "job_assignments" AS a
SET "ended_at" = NOW(), "end_reason" = 'reassigned'
WHERE a."ended_at" IS NULL
  AND a."id" NOT IN (
    SELECT keep."id" FROM (
      SELECT DISTINCT ON ("job_id") "id"
      FROM "job_assignments"
      ORDER BY "job_id", "assigned_at" DESC
    ) AS keep
  );--> statement-breakpoint
UPDATE "job_assignments" AS a
SET "ended_at" = NOW(), "end_reason" = 'cancelled'
FROM "jobs" AS j
WHERE a."job_id" = j."id"
  AND j."status" = 'cancelled'
  AND a."ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_assignments_one_open" ON "job_assignments" ("job_id") WHERE "ended_at" IS NULL;
