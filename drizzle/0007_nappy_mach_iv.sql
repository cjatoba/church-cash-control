CREATE TYPE "public"."payment_method" AS ENUM('pix', 'cash');--> statement-breakpoint
CREATE TABLE "custody_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"registered_by_user_id" uuid NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"amount_cents" integer NOT NULL,
	"transfer_date" date NOT NULL,
	"description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "received_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "registered_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "one_off_donations" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "one_off_donations" ADD COLUMN "received_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "one_off_donations" ADD COLUMN "registered_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_off_donations" ADD CONSTRAINT "one_off_donations_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_off_donations" ADD CONSTRAINT "one_off_donations_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;