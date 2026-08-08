CREATE TYPE "public"."pricing_unit" AS ENUM('fixed', 'm3', 'unit');--> statement-breakpoint
CREATE TYPE "public"."quote_source" AS ENUM('panel', 'website');--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"short_description" varchar(280),
	"description" text,
	"pricing_type" "pricing_unit" DEFAULT 'fixed' NOT NULL,
	"base_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"included_m3" numeric(10, 2),
	"included_units" integer,
	"highlights" text,
	"active" boolean DEFAULT true NOT NULL,
	"show_on_home" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "package_id" uuid;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "pricing_unit" "pricing_unit" DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "package_id" uuid;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "estimated_m3" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "estimated_items" integer;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "source" "quote_source" DEFAULT 'panel' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_package_id_service_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."service_packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_package_id_service_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."service_packages"("id") ON DELETE set null ON UPDATE no action;