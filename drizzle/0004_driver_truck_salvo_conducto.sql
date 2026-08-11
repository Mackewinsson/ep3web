ALTER TABLE "job_assignments" ALTER COLUMN "truck_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_folio" varchar(80);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_issued_at" date;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_origin_commune" varchar(120);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_destination_commune" varchar(120);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_notes" text;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_completed_at" timestamp with time zone;
