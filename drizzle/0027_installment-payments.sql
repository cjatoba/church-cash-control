CREATE TABLE "installment_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"payment_method" "payment_method",
	"received_by_user_id" uuid,
	"registered_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "installments" DROP CONSTRAINT "installments_received_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "installments" DROP CONSTRAINT "installments_registered_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_installment_id_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installment_payments_installment_id_idx" ON "installment_payments" USING btree ("installment_id");--> statement-breakpoint
INSERT INTO "installment_payments" ("installment_id", "amount_cents", "paid_at", "payment_method", "received_by_user_id", "registered_by_user_id")
SELECT "id", coalesce("paid_amount_cents", "amount_cents"), "paid_at", "payment_method", "received_by_user_id", "registered_by_user_id"
FROM "installments" WHERE "paid_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN "paid_amount_cents";--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN "received_by_user_id";--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN "registered_by_user_id";