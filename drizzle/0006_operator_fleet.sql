ALTER TABLE "drivers" ADD COLUMN "operator_id" uuid;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "operator_id" uuid;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "crew_driver_id" uuid;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_operator_id_drivers_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_operator_id_drivers_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_crew_driver_id_drivers_id_fk" FOREIGN KEY ("crew_driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;
