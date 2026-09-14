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
] as const;

export type ActivityLogAction = (typeof ACTIVITY_LOG_ACTIONS)[number];

const activityLogInputSchema = z.object({
  actorUserId: z.string().trim().min(1, "Usuário responsável pela ação é obrigatório"),
  action: z.enum(ACTIVITY_LOG_ACTIONS),
  subjectName: z.string().trim().min(1, "Nome do item da ação é obrigatório"),
  amountCents: z.number().int().nonnegative().nullable(),
});

export interface ActivityLogEntry {
  actorUserId: string;
  action: ActivityLogAction;
  subjectName: string;
  amount: Money | null;
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
    occurredAt,
  };
}
