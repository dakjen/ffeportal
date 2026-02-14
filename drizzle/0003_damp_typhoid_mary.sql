ALTER TABLE "quote_items" ADD COLUMN "quantity" numeric DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "unit_price" numeric;