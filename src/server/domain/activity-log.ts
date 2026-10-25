import { z } from "zod";
import { Money } from "./money";

export const ACTIVITY_LOG_ACTIONS = [
  "installment_paid",
  "installment_payment_corrected",
  "installment_payment_reverted",
  "campaign_updated",
  "campaign_archived",
  "campaign_restored",
  "transaction_category_archived",
  "transaction_category_restored",
  "campaign_created",
  "pledge_type_created",
  "donor_created",
  "donor_updated",
  "donor_anonymized",
  "pledge_type_changed",
  "one_off_donation_created",
  "one_off_donation_corrected",
  "one_off_donation_deleted",
  "loose_contribution_created",
  "loose_contribution_corrected",
  "loose_contribution_deleted",
  "loose_pledge_closed",
  "loose_pledge_reopened",
  "custody_transfer_created",
  "custody_transfer_corrected",
  "custody_transfer_deleted",
  "user_invited",
  "user_updated",
  "user_access_activated",
  "user_password_reset",
  "user_deactivated",
  "user_reactivated",
  "app_branding_updated",
] as const;

export type ActivityLogAction = (typeof ACTIVITY_LOG_ACTIONS)[number];

const activityLogInputSchema = z.object({
  actorUserId: z.string().trim().min(1, "Usuário responsável pela ação é obrigatório"),
  action: z.enum(ACTIVITY_LOG_ACTIONS),
  subjectName: z.string().trim().min(1, "Nome do item da ação é obrigatório"),
  amountCents: z.number().int().nonnegative().nullable(),
  details: z.string().trim().nullable().default(null),
});

export interface ActivityLogEntry {
  actorUserId: string;
  action: ActivityLogAction;
  subjectName: string;
  amount: Money | null;
  details: string | null;
  occurredAt: Date;
}

export function parseActivityLogEntry(
  input: unknown,
  occurredAt: Date = new Date(),
): ActivityLogEntry {
  const data = activityLogInputSchema.parse(input);
  return {
    actorUserId: data.actorUserId,
    action: data.action,
    subjectName: data.subjectName,
    amount: data.amountCents === null ? null : Money.fromCents(data.amountCents),
    // Truncado em vez de rejeitado: o registro acontece depois da ação já
    // salva, e um detalhe longo demais não pode fazer a ação parecer falha.
    details: data.details && data.details.length > 0 ? data.details.slice(0, 500) : null,
    occurredAt,
  };
}

export interface FieldChange {
  label: string;
  before: string;
  after: string;
}

export function describeChanges(changes: readonly FieldChange[]): string | null {
  const changed = changes
    .filter((change) => change.before !== change.after)
    .map((change) => `${change.label}: ${change.before} → ${change.after}`);
  return changed.length === 0 ? null : changed.join(" · ");
}
