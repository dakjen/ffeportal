CREATE TYPE "public"."labor_request_progress" AS ENUM('quote_sent', 'quote_accepted', 'timeline_developed', 'project_started', 'project_completed');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"location" varchar(256),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "client_email" varchar(256);--> statement-breakpoint
ALTER TABLE "labor_requests" ADD COLUMN "progress" "labor_request_progress";--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ein" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_number" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "insurance_info" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trades" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "brand_color_primary" varchar(7) DEFAULT '#710505';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "brand_color_secondary" varchar(7) DEFAULT '#f0f0f0';--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;