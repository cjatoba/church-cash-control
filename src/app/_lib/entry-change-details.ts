import { describeChanges, type FieldChange } from "@/server/domain/activity-log";
import type { Money } from "@/server/domain/money";
import type { PaymentMethod } from "@/server/domain/payment-method";
import { formatCurrency } from "./format";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

interface EntryFields {
  amount: Money;
  date: Date;
  paymentMethod: PaymentMethod | null;
  receivedByUserId: string | null;
  donorName?: string | null;
}

function nameOf(names: ReadonlyMap<string, string>, userId: string | null): string {
  return userId ? (names.get(userId) ?? "—") : "—";
}

export function describeEntryCorrection(
  before: EntryFields,
  after: EntryFields,
  names: ReadonlyMap<string, string>,
): string | null {
  const changes: FieldChange[] = [
    {
      label: "Recebido por",
      before: nameOf(names, before.receivedByUserId),
      after: nameOf(names, after.receivedByUserId),
    },
    { label: "Valor", before: formatCurrency(before.amount), after: formatCurrency(after.amount) },
    { label: "Data", before: formatDate(before.date), after: formatDate(after.date) },
    {
      label: "Forma",
      before: before.paymentMethod ? paymentMethodLabels[before.paymentMethod] : "—",
      after: after.paymentMethod ? paymentMethodLabels[after.paymentMethod] : "—",
    },
  ];
  if (before.donorName !== undefined || after.donorName !== undefined) {
    changes.push({
      label: "Doador",
      before: before.donorName ?? "Anônimo",
      after: after.donorName ?? "Anônimo",
    });
  }
  return describeChanges(changes);
}

interface TransferFields {
  fromUserId: string;
  recipientName: string;
  amount: Money;
  transferDate: Date;
  description: string | null;
}

export function describeTransferCorrection(
  before: TransferFields,
  after: TransferFields,
  names: ReadonlyMap<string, string>,
): string | null {
  return describeChanges([
    {
      label: "Quem repassou",
      before: nameOf(names, before.fromUserId),
      after: nameOf(names, after.fromUserId),
    },
    { label: "Para", before: before.recipientName, after: after.recipientName },
    { label: "Valor", before: formatCurrency(before.amount), after: formatCurrency(after.amount) },
    {
      label: "Data",
      before: formatDate(before.transferDate),
      after: formatDate(after.transferDate),
    },
    { label: "Observação", before: before.description ?? "—", after: after.description ?? "—" },
  ]);
}

export function toNameMap(users: readonly { id: string; name: string }[]): Map<string, string> {
  return new Map(users.map((user) => [user.id, user.name]));
}
