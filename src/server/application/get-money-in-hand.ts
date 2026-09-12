import { calculateAvailableBalance } from "../domain/custody-transfer";
import type { Money } from "../domain/money";

export interface UserCustodyTotals {
  userId: string;
  userLabel: string;
  receivedCents: number;
  transferredCents: number;
}

export interface MoneyInHandReader {
  getTotalsByCampaign(campaignId: string): Promise<UserCustodyTotals[]>;
}

export interface MoneyInHandBalance {
  userId: string;
  userLabel: string;
  balance: Money;
}

export async function getMoneyInHand(
  reader: MoneyInHandReader,
  campaignId: string,
): Promise<MoneyInHandBalance[]> {
  const totals = await reader.getTotalsByCampaign(campaignId);
  return totals.map((total) => ({
    userId: total.userId,
    userLabel: total.userLabel,
    balance: calculateAvailableBalance(total.receivedCents, total.transferredCents),
  }));
}
