import {
  assertTransferChangeKeepsBalances,
  assertTransferDateNotInFuture,
  calculateAvailableBalance,
  parseCustodyTransferInput,
} from "../domain/custody-transfer";
import { Money } from "../domain/money";

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
  toUserId: string | null;
  recipientName: string | null;
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
  assertTransferDateNotInFuture(parsed.transferDate, today);
  const balances = await readBalances(dependencies.balanceReader, parsed.campaignId, [
    parsed.fromUserId,
  ]);
  assertTransferChangeKeepsBalances(null, parsed, balanceLookup(balances));

  return dependencies.repository.create({ ...parsed, registeredByUserId });
}

export async function readBalances(
  balanceReader: CustodyBalanceReader,
  campaignId: string,
  userIds: readonly (string | null)[],
): Promise<Map<string, Money>> {
  const distinct = [...new Set(userIds.filter((userId) => userId !== null))];
  const entries = await Promise.all(
    distinct.map(async (userId) => {
      const totals = await balanceReader.getAvailableBalance(campaignId, userId);
      return [
        userId,
        calculateAvailableBalance(totals.receivedCents, totals.transferredCents),
      ] as const;
    }),
  );
  return new Map(entries);
}

export function balanceLookup(balances: ReadonlyMap<string, Money>): (userId: string) => Money {
  return (userId) => balances.get(userId) ?? Money.fromCents(0);
}
