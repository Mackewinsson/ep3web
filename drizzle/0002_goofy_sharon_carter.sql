CREATE TYPE "public"."staff_role" AS ENUM('admin', 'driver');--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "scheduled_time" varchar(5);--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "role" "staff_role" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "driver_id" uuid;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_driver_id_unique" UNIQUE("driver_id");