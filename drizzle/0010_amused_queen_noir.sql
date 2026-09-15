ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_only" numeric(14, 2) DEFAULT '30000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_1" numeric(14, 2) DEFAULT '60000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_2" numeric(14, 2) DEFAULT '90000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "quote_pricing_settings" ADD COLUMN IF NOT EXISTS "helper_driver_plus_3" numeric(14, 2) DEFAULT '120000' NOT NULL;
