CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" uuid NOT NULL,
	"type" varchar(60) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"href" varchar(300),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_assignments" ALTER COLUMN "truck_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "operator_id" uuid;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "crew_driver_id" uuid;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_folio" varchar(80);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_issued_at" date;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_origin_commune" varchar(120);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_destination_commune" varchar(120);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_notes" text;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "salvo_conducto_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "crew_driver_rut" varchar(20);--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD COLUMN "end_reason" varchar(40);--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN "operator_margin_percent" numeric(5, 2) DEFAULT '20' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN "helper_driver_only" numeric(14, 2) DEFAULT '30000' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN "helper_driver_plus_1" numeric(14, 2) DEFAULT '60000' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN "helper_driver_plus_2" numeric(14, 2) DEFAULT '90000' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN "helper_driver_plus_3" numeric(14, 2) DEFAULT '120000' NOT NULL;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "operator_id" uuid;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "default_driver_id" uuid;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "permiso_circulacion_number" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "permiso_circulacion_expires_at" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_policy_number" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_insurer" varchar(120);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_expires_at" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "revision_tecnica_folio" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "revision_tecnica_expires_at" date;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_staff_user_id_staff_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_operator_id_drivers_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_crew_driver_id_drivers_id_fk" FOREIGN KEY ("crew_driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_operator_id_drivers_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_default_driver_id_drivers_id_fk" FOREIGN KEY ("default_driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_assignments_one_open" ON "job_assignments" USING btree ("job_id") WHERE "job_assignments"."ended_at" is null;