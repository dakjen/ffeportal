ALTER TABLE "services" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "pricing_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "pricing_type" DROP NOT NULL;