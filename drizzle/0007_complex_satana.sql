ALTER TABLE "quotes" ADD COLUMN "net_price" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "tax_rate" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "tax_amount" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "delivery_fee" numeric DEFAULT '0';