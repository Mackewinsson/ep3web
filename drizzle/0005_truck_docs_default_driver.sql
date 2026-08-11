ALTER TABLE "trucks" ADD COLUMN "default_driver_id" uuid;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "permiso_circulacion_number" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "permiso_circulacion_expires_at" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_policy_number" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_insurer" varchar(120);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "soap_expires_at" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "revision_tecnica_folio" varchar(80);--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "revision_tecnica_expires_at" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_default_driver_id_drivers_id_fk" FOREIGN KEY ("default_driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;
