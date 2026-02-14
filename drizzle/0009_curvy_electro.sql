CREATE TYPE "public"."round_option" AS ENUM('none', 'up', 'down');--> statement-breakpoint
CREATE TABLE "pricing_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"internal_cost_input" numeric,
	"margin_input" numeric,
	"calculated_price" numeric,
	"pricing_type" "pricing_type" DEFAULT 'flat' NOT NULL,
	"round_option" "round_option" DEFAULT 'none' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "service_pricing" CASCADE;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price" numeric;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "pricing_type" "pricing_type";--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "internal_cost" numeric;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "margin" numeric;