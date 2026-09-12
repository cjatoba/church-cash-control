ALTER TABLE "campaigns" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD COLUMN "active" boolean DEFAULT true NOT NULL;