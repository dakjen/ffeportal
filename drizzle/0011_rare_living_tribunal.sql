ALTER TABLE "quotes" ALTER COLUMN "request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "project_name" varchar(256);--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;