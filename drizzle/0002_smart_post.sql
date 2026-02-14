CREATE TYPE "public"."pricing_type" AS ENUM('hourly', 'flat');--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"price" numeric NOT NULL,
	"pricing_type" "pricing_type" DEFAULT 'flat' NOT NULL,
	"internal_cost" numeric,
	"margin" numeric,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
