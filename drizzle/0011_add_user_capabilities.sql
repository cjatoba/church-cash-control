ALTER TABLE "users" ADD COLUMN "can_manage_users" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_manage_campaigns" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_receive_funds" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users" SET "can_manage_users" = true, "can_manage_campaigns" = true, "can_receive_funds" = true WHERE "role" = 'admin';--> statement-breakpoint
UPDATE "users" SET "can_receive_funds" = true WHERE "role" = 'fundraiser';