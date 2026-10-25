import {
  assertTransferCorrectionWithinBalance,
  calculateAvailableBalance,
  parseCustodyTransferInput,
} from "../domain/custody-transfer";
import type { Money } from "../domain/money";
import type { CustodyBalanceReader } from "./create-custody-transfer";
import type { StoredEntry } from "./correct-received-entry";

export interface CustodyTransferFields {
  fromUserId: string;
  recipientName: string;
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

  const totals = await dependencies.balanceReader.getAvailableBalance(campaignId, after.fromUserId);
  assertTransferCorrectionWithinBalance(
    before,
    after,
    calculateAvailableBalance(totals.receivedCents, totals.transferredCents),
    today,
  );

  await dependencies.store.update(transferId, after);
  return { subjectName, before, after };
}

// Excluir um repasse só devolve o valor ao saldo de quem repassou — nunca
// deixa ninguém negativo, então não precisa conferir saldo.
export async function deleteCustodyTransfer(
  dependencies: CorrectCustodyTransferDependencies,
  campaignId: string,
  transferId: string,
): Promise<StoredEntry<CustodyTransferFields>> {
  const transfer = await findInCampaign(dependencies.store, campaignId, transferId);
  await dependencies.store.remove(transferId);
  return transfer;
}
