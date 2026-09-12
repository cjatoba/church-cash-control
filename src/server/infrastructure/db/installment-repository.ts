import { eq } from "drizzle-orm";
import type {
  InstallmentReader,
  InstallmentRepository,
} from "@/server/application/pay-installment";
import { Money } from "@/server/domain/money";
import type { DbClient } from "./client";
import { installments } from "./schema";

export function createInstallmentRepository(
  db: DbClient,
): InstallmentReader & InstallmentRepository {
  return {
    async findById(installmentId) {
      const [row] = await db
        .select()
        .from(installments)
        .where(eq(installments.id, installmentId))
        .limit(1);

      if (!row) {
        return null;
      }
      return {
        amount: Money.fromCents(row.amountCents),
        paidAt: row.paidAt,
      };
    },

    async markAsPaid(installmentId, payment) {
      await db
        .update(installments)
        .set({
          paidAt: payment.paidAt,
          paidAmountCents: payment.paidAmount.toCents(),
        })
        .where(eq(installments.id, installmentId));
    },
  };
}
