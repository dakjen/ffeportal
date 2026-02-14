CREATE TABLE "service_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"price" numeric NOT NULL,
	"pricing_type" "pricing_type" DEFAULT 'flat' NOT NULL,
	"internal_cost" numeric,
	"margin" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_pricing" ADD CONSTRAINT "service_pricing_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "pricing_type";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "internal_cost";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "margin";