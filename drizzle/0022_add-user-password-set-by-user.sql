ALTER TABLE "users" ADD COLUMN "password_set_by_user" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users" SET "password_set_by_user" = true WHERE "must_change_password" = false;
