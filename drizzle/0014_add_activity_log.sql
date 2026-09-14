CREATE TYPE "public"."activity_log_action" AS ENUM('installment_paid', 'installment_payment_corrected', 'installment_payment_reverted', 'campaign_updated', 'campaign_archived', 'campaign_restored', 'transaction_category_archived', 'transaction_category_restored');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" "activity_log_action" NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"amount_cents" integer,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;