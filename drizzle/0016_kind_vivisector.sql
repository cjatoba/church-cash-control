CREATE TYPE "public"."loose_pledge_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "loose_pledge_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loose_pledge_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"received_by_user_id" uuid NOT NULL,
	"registered_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loose_pledges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"pledge_type_id" uuid NOT NULL,
	"status" "loose_pledge_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pledge_types" ALTER COLUMN "installment_value_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loose_pledge_contributions" ADD CONSTRAINT "loose_pledge_contributions_loose_pledge_id_loose_pledges_id_fk" FOREIGN KEY ("loose_pledge_id") REFERENCES "public"."loose_pledges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loose_pledge_contributions" ADD CONSTRAINT "loose_pledge_contributions_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loose_pledge_contributions" ADD CONSTRAINT "loose_pledge_contributions_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loose_pledges" ADD CONSTRAINT "loose_pledges_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loose_pledges" ADD CONSTRAINT "loose_pledges_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loose_pledges" ADD CONSTRAINT "loose_pledges_pledge_type_id_pledge_types_id_fk" FOREIGN KEY ("pledge_type_id") REFERENCES "public"."pledge_types"("id") ON DELETE cascade ON UPDATE no action;