import { calculateAvailableBalance } from "../domain/custody-transfer";
import type { Money } from "../domain/money";
import {
  assertEntryChangeKeepsBalance,
  type ReceivedAmount,
} from "../domain/money-entry-correction";
import { parseContributionCorrection, type ContributionCorrection } from "../domain/loose-pledge";
import {
  parseOneOffDonationCorrection,
  type OneOffDonationCorrection,
} from "../domain/one-off-donation";
import type { PaymentMethod } from "../domain/payment-method";
import type { CustodyBalanceReader } from "./create-custody-transfer";

// subjectName: como a entrada aparece para quem lê (doador ou "Doação
// anônima"), usado no título da tela e no registro de atividades.
export interface StoredEntry<Stored> {
  campaignId: string;
  subjectName: string;
  // Doador cadastrado de quem veio a entrada (entrega de carnê avulso);
  // null em doação sem carnê e repasse, que não citam um doador cadastrado.
  donorId: string | null;
  fields: Stored;
}

export interface ReceivedEntryStore<Stored extends ReceivedAmount, Corrected> {
  findById(id: string): Promise<StoredEntry<Stored> | null>;
  update(id: string, fields: Corrected): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ReceivedEntryDependencies<Stored extends ReceivedAmount, Corrected> {
  store: ReceivedEntryStore<Stored, Corrected>;
  balanceReader: CustodyBalanceReader;
}

export async function findReceivedEntry<Stored extends ReceivedAmount, Corrected>(
  store: ReceivedEntryStore<Stored, Corrected>,
  campaignId: string,
  id: string,
): Promise<StoredEntry<Stored> | null> {
  const entry = await store.findById(id);
  return entry?.campaignId === campaignId ? entry : null;
}

async function findInCampaign<Stored extends ReceivedAmount, Corrected>(
  store: ReceivedEntryStore<Stored, Corrected>,
  campaignId: string,
  id: string,
): Promise<StoredEntry<Stored>> {
  const entry = await findReceivedEntry(store, campaignId, id);
  if (!entry) {
    throw new Error("Entrada não encontrada");
  }
  return entry;
}

export interface EntryCorrection<Stored, Corrected> {
  subjectName: string;
  donorId: string | null;
  before: Stored;
  after: Corrected;
}

async function previousReceiverBalance(
  balanceReader: CustodyBalanceReader,
  campaignId: string,
  entry: ReceivedAmount,
): Promise<Money> {
  const totals = entry.receivedByUserId
    ? await balanceReader.getAvailableBalance(campaignId, entry.receivedByUserId)
    : { receivedCents: 0, transferredCents: 0 };
  return calculateAvailableBalance(totals.receivedCents, totals.transferredCents);
}

async function correctReceivedEntry<
  Stored extends ReceivedAmount,
  Corrected extends ReceivedAmount,
>(
  dependencies: ReceivedEntryDependencies<Stored, Corrected>,
  campaignId: string,
  id: string,
  corrected: Corrected,
): Promise<EntryCorrection<Stored, Corrected>> {
  const {
    subjectName,
    donorId,
    fields: before,
  } = await findInCampaign(dependencies.store, campaignId, id);
  assertEntryChangeKeepsBalance(
    before,
    corrected,
    await previousReceiverBalance(dependencies.balanceReader, campaignId, before),
  );
  await dependencies.store.update(id, corrected);
  return { subjectName, donorId, before, after: corrected };
}

async function deleteReceivedEntry<Stored extends ReceivedAmount, Corrected>(
  dependencies: ReceivedEntryDependencies<Stored, Corrected>,
  campaignId: string,
  id: string,
): Promise<StoredEntry<Stored>> {
  const entry = await findInCampaign(dependencies.store, campaignId, id);
  assertEntryChangeKeepsBalance(
    entry.fields,
    null,
    await previousReceiverBalance(dependencies.balanceReader, campaignId, entry.fields),
  );
  await dependencies.store.remove(id);
  return entry;
}

// Doações antigas podem não ter forma de pagamento nem recebedor (colunas
// opcionais desde antes do "Dinheiro em mãos").
export interface StoredOneOffDonation {
  donorName: string | null;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod | null;
  receivedByUserId: string | null;
}

export type OneOffDonationStore = ReceivedEntryStore<
  StoredOneOffDonation,
  OneOffDonationCorrection
>;
type OneOffDonationDependencies = ReceivedEntryDependencies<
  StoredOneOffDonation,
  OneOffDonationCorrection
>;

export function correctOneOffDonation(
  dependencies: OneOffDonationDependencies,
  campaignId: string,
  donationId: string,
  input: unknown,
): Promise<EntryCorrection<StoredOneOffDonation, OneOffDonationCorrection>> {
  return correctReceivedEntry(
    dependencies,
    campaignId,
    donationId,
    parseOneOffDonationCorrection(input),
  );
}

export function deleteOneOffDonation(
  dependencies: OneOffDonationDependencies,
  campaignId: string,
  donationId: string,
): Promise<StoredEntry<StoredOneOffDonation>> {
  return deleteReceivedEntry(dependencies, campaignId, donationId);
}

export type LooseContributionStore = ReceivedEntryStore<
  ContributionCorrection,
  ContributionCorrection
>;
type LooseContributionDependencies = ReceivedEntryDependencies<
  ContributionCorrection,
  ContributionCorrection
>;

export function correctLooseContribution(
  dependencies: LooseContributionDependencies,
  campaignId: string,
  contributionId: string,
  input: unknown,
): Promise<EntryCorrection<ContributionCorrection, ContributionCorrection>> {
  return correctReceivedEntry(
    dependencies,
    campaignId,
    contributionId,
    parseContributionCorrection(input),
  );
}

export function deleteLooseContribution(
  dependencies: LooseContributionDependencies,
  campaignId: string,
  contributionId: string,
): Promise<StoredEntry<ContributionCorrection>> {
  return deleteReceivedEntry(dependencies, campaignId, contributionId);
}
