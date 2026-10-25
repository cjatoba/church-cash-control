ALTER TABLE "activity_log" ADD COLUMN "donor_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Atividades registradas antes desta coluna existir: liga ao doador pelo
-- nome, só quando um único doador (não removido) tem aquele nome, para
-- nunca apagar depois o nome de um homônimo.
UPDATE "activity_log" AS "log"
SET "donor_id" = "donor"."id"
FROM "donors" AS "donor"
WHERE "log"."donor_id" IS NULL
  AND "donor"."anonymized_at" IS NULL
  AND "log"."subject_name" = "donor"."name"
  AND "log"."action" IN (
    'installment_paid',
    'installment_payment_corrected',
    'installment_payment_reverted',
    'donor_created',
    'donor_updated',
    'pledge_type_changed',
    'loose_contribution_created',
    'loose_contribution_corrected',
    'loose_contribution_deleted',
    'loose_pledge_closed',
    'loose_pledge_reopened'
  )
  AND (SELECT count(*) FROM "donors" AS "other" WHERE "other"."name" = "donor"."name") = 1;
