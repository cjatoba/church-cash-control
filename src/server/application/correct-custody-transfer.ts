import {
  assertTransferChangeKeepsBalances,
  assertTransferDateNotInFuture,
  parseCustodyTransferInput,
} from "../domain/custody-transfer";
import type { Money } from "../domain/money";
import { balanceLookup, readBalances, type CustodyBalanceReader } from "./create-custody-transfer";
import type { StoredEntry } from "./correct-received-entry";

export interface CustodyTransferFields {
  fromUserId: string;
  toUserId: string | null;
  recipientName: string | null;
  amount: Money;
  transferDate: Date;
  description: string | null;
}

export interface CustodyTransferStore {
  findById(id: string): Promise<StoredEntry<CustodyTransferFields> | null>;
  update(id: string, fields: CustodyTransferFields): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface CorrectCustodyTransferDependencies {
  store: CustodyTransferStore;
  balanceReader: CustodyBalanceReader;
}

export async function findCustodyTransfer(
  store: CustodyTransferStore,
  campaignId: string,
  transferId: string,
): Promise<StoredEntry<CustodyTransferFields> | null> {
  const transfer = await store.findById(transferId);
  return transfer?.campaignId === campaignId ? transfer : null;
}

async function findInCampaign(
  store: CustodyTransferStore,
  campaignId: string,
  transferId: string,
): Promise<StoredEntry<CustodyTransferFields>> {
  const transfer = await findCustodyTransfer(store, campaignId, transferId);
  if (!transfer) {
    throw new Error("Repasse não encontrado");
  }
  return transfer;
}

export async function correctCustodyTransfer(
  dependencies: CorrectCustodyTransferDependencies,
  campaignId: string,
  transferId: string,
  input: unknown,
  today: Date = new Date(),
): Promise<{ subjectName: string; before: CustodyTransferFields; after: CustodyTransferFields }> {
  const parsed = parseCustodyTransferInput({
    ...(typeof input === "object" ? input : {}),
    campaignId,
  });
  const after: CustodyTransferFields = {
    fromUserId: parsed.fromUserId,
    toUserId: parsed.toUserId,
    recipientName: parsed.recipientName,
    amount: parsed.amount,
    transferDate: parsed.transferDate,
    description: parsed.description,
  };
  const { subjectName, fields: before } = await findInCampaign(
    dependencies.store,
    campaignId,
    transferId,
  );

  assertTransferDateNotInFuture(after.transferDate, today);
  const balances = await readBalances(dependencies.balanceReader, campaignId, [
    before.fromUserId,
    before.toUserId,
    after.fromUserId,
    after.toUserId,
  ]);
  assertTransferChangeKeepsBalances(before, after, balanceLookup(balances));

  await dependencies.store.update(transferId, after);
  return { subjectName, before, after };
}

export async function deleteCustodyTransfer(
  dependencies: CorrectCustodyTransferDependencies,
  campaignId: string,
  transferId: string,
): Promise<StoredEntry<CustodyTransferFields>> {
  const transfer = await findInCampaign(dependencies.store, campaignId, transferId);
  const balances = await readBalances(dependencies.balanceReader, campaignId, [
    transfer.fields.toUserId,
  ]);
  assertTransferChangeKeepsBalances(transfer.fields, null, balanceLookup(balances));
  await dependencies.store.remove(transferId);
  return transfer;
}
