ALTER TABLE "custody_transfers" ALTER COLUMN "recipient_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD COLUMN "to_user_id" uuid;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;