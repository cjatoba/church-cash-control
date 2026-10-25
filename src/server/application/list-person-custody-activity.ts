import { calculateAvailableBalance } from "../domain/custody-transfer";
import { Money } from "../domain/money";
import type { PaymentMethod } from "../domain/payment-method";

export type ReceivedEntryKind = "installment" | "one_off_donation" | "loose_contribution";

// sourceId aponta para o carnê de origem (parcela/entrega); doação sem carnê
// não tem. dueDate só existe para parcela.
export interface PersonReceivedEntry {
  kind: ReceivedEntryKind;
  id: string;
  sourceId: string | null;
  donorLabel: string | null;
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod | null;
  registeredByLabel: string | null;
  dueDate: Date | null;
}

export interface PersonTransfer {
  id: string;
  recipientName: string;
  amount: Money;
  transferDate: Date;
  registeredByLabel: string;
}

export interface PersonCustodyActivityReader {
  findReceivedEntries(campaignId: string, userId: string): Promise<PersonReceivedEntry[]>;
  findTransfersFrom(campaignId: string, userId: string): Promise<PersonTransfer[]>;
}

export interface PersonCustodyActivity {
  received: PersonReceivedEntry[];
  transfers: PersonTransfer[];
  receivedTotal: Money;
  transferredTotal: Money;
  balance: Money;
}

function sumCents(amounts: Money[]): number {
  return amounts.reduce((sum, amount) => sum + amount.toCents(), 0);
}

export async function listPersonCustodyActivity(
  reader: PersonCustodyActivityReader,
  campaignId: string,
  userId: string,
): Promise<PersonCustodyActivity> {
  const [received, transfers] = await Promise.all([
    reader.findReceivedEntries(campaignId, userId),
    reader.findTransfersFrom(campaignId, userId),
  ]);
  const receivedCents = sumCents(received.map((entry) => entry.amount));
  const transferredCents = sumCents(transfers.map((transfer) => transfer.amount));

  return {
    received: [...received].sort((a, b) => b.date.getTime() - a.date.getTime()),
    transfers: [...transfers].sort((a, b) => b.transferDate.getTime() - a.transferDate.getTime()),
    receivedTotal: Money.fromCents(receivedCents),
    transferredTotal: Money.fromCents(transferredCents),
    balance: calculateAvailableBalance(receivedCents, transferredCents),
  };
}
