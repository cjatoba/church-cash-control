import {
  assertTransferWithinBalance,
  calculateAvailableBalance,
  parseCustodyTransferInput,
} from "../domain/custody-transfer";
import type { Money } from "../domain/money";

export interface CustodyBalanceTotals {
  receivedCents: number;
  transferredCents: number;
}

export interface CustodyBalanceReader {
  getAvailableBalance(campaignId: string, userId: string): Promise<CustodyBalanceTotals>;
}

export interface CustodyTransferRecord {
  campaignId: string;
  fromUserId: string;
  recipientName: string;
  amount: Money;
  transferDate: Date;
  description: string | null;
  registeredByUserId: string;
}

export interface CustodyTransferRepository {
  create(transfer: CustodyTransferRecord): Promise<{ id: string }>;
}

export interface CreateCustodyTransferDependencies {
  balanceReader: CustodyBalanceReader;
  repository: CustodyTransferRepository;
}

export async function createCustodyTransfer(
  dependencies: CreateCustodyTransferDependencies,
  input: unknown,
  registeredByUserId: string,
  today: Date = new Date(),
): Promise<{ id: string }> {
  const parsed = parseCustodyTransferInput(input);
  const totals = await dependencies.balanceReader.getAvailableBalance(
    parsed.campaignId,
    parsed.fromUserId,
  );
  const availableBalance = calculateAvailableBalance(totals.receivedCents, totals.transferredCents);
  assertTransferWithinBalance(parsed.amount, availableBalance, parsed.transferDate, today);

  return dependencies.repository.create({ ...parsed, registeredByUserId });
}
