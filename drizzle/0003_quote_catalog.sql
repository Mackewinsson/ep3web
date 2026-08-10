CREATE TABLE "moving_catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(200) NOT NULL,
	"volume_m3" numeric(10, 3) DEFAULT '0.1' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moving_catalog_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "moving_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moving_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quote_pricing_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boxes_per_m3" numeric(8, 3) DEFAULT '0.700' NOT NULL,
	"min_boxes" integer DEFAULT 6 NOT NULL,
	"box_volume_m3" numeric(8, 3) DEFAULT '0.080' NOT NULL,
	"price_per_m3" numeric(14, 2) DEFAULT '25000' NOT NULL,
	"no_elevator_per_floor" numeric(14, 2) DEFAULT '15000' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moving_catalog_items" ADD CONSTRAINT "moving_catalog_items_category_id_moving_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."moving_categories"("id") ON DELETE cascade ON UPDATE no action;