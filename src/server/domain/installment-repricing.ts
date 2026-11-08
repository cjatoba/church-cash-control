import type { PaymentMethod } from "./payment-method";

// id existe para pagamentos já gravados; os que a recontagem cria nascem sem.
export interface SlotPayment {
  id?: string;
  paidAt: Date;
  paidAmountCents: number;
  paymentMethod: PaymentMethod | null;
  receivedByUserId: string | null;
  registeredByUserId: string | null;
}

export interface InstallmentSlot {
  id: string;
  dueDate: Date;
  amountCents: number;
  payments: SlotPayment[];
}

interface SingleSlot {
  id: string;
  dueDate: Date;
  amountCents: number;
  payment: SlotPayment | null;
}

interface PaidUnit {
  amountCents: number;
  payment: SlotPayment;
}

function samePaymentOrigin(a: SlotPayment, b: SlotPayment): boolean {
  return (
    a.paidAt.toISOString().slice(0, 10) === b.paidAt.toISOString().slice(0, 10) &&
    a.paymentMethod === b.paymentMethod &&
    a.receivedByUserId === b.receivedByUserId &&
    a.registeredByUserId === b.registeredByUserId
  );
}

function groupConsecutive(paid: SingleSlot[]): SingleSlot[][] {
  const groups: SingleSlot[][] = [];
  for (const slot of paid) {
    const last = groups.at(-1);
    const lastPayment = last?.at(-1)?.payment;
    if (last && lastPayment && slot.payment && samePaymentOrigin(lastPayment, slot.payment)) {
      last.push(slot);
    } else {
      groups.push([slot]);
    }
  }
  return groups;
}

function toUnits(groupPayment: SlotPayment, totalCents: number, valueCents: number): PaidUnit[] {
  const { paidAt, paymentMethod, receivedByUserId, registeredByUserId } = groupPayment;
  return Array.from({ length: totalCents / valueCents }, () => ({
    amountCents: valueCents,
    payment: {
      paidAt,
      paidAmountCents: valueCents,
      paymentMethod,
      receivedByUserId,
      registeredByUserId,
    },
  }));
}

// Parcela paga em parte ou em mais de uma vez fica como está: o doador
// completa o que combinou naquele mês, e não há como recontar pagamentos
// parciais num valor novo sem inventar para onde vai a diferença.
function keepsItsPayments(slot: InstallmentSlot): boolean {
  const [first, ...others] = slot.payments;
  return first !== undefined && (others.length > 0 || first.paidAmountCents < slot.amountCents);
}

function toSingle(slot: InstallmentSlot): SingleSlot {
  return {
    id: slot.id,
    dueDate: slot.dueDate,
    amountCents: slot.amountCents,
    payment: slot.payments[0] ?? null,
  };
}

function fromSingle(slot: SingleSlot): InstallmentSlot {
  return {
    id: slot.id,
    dueDate: slot.dueDate,
    amountCents: slot.amountCents,
    payments: slot.payment ? [slot.payment] : [],
  };
}

/**
 * Ao trocar o valor da parcela, o que já foi pago é recontado no valor novo:
 * R$ 100 pagos viram duas parcelas de R$ 50, e dois pagamentos iguais de
 * R$ 50 (mesma data, forma e quem recebeu) viram uma parcela de R$ 100. Só
 * quando fecha certinho — um valor quebrado mantém o pagamento como estava,
 * e nada é recontado se o pago passar do número de parcelas do carnê. Os
 * pagamentos ocupam as primeiras parcelas, como num carnê de papel.
 */
export function repriceInstallments(
  installments: InstallmentSlot[],
  newValueCents: number,
): { installments: InstallmentSlot[]; paymentsRedistributed: boolean } {
  const kept = installments.filter(keepsItsPayments);
  const repriced = repriceSingles(
    installments.filter((slot) => !keepsItsPayments(slot)).map(toSingle),
    newValueCents,
  );
  return {
    installments: [...kept, ...repriced.installments.map(fromSingle)].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    ),
    paymentsRedistributed: repriced.paymentsRedistributed,
  };
}

function repriceSingles(
  installments: SingleSlot[],
  newValueCents: number,
): { installments: SingleSlot[]; paymentsRedistributed: boolean } {
  const ordered = [...installments].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const keepPaidAsIs = {
    installments: ordered.map((slot) =>
      slot.payment ? slot : { ...slot, amountCents: newValueCents },
    ),
    paymentsRedistributed: false,
  };

  const units: PaidUnit[] = [];
  let changed = false;
  for (const group of groupConsecutive(ordered.filter((slot) => slot.payment))) {
    const first = group[0]?.payment;
    if (!first) {
      continue;
    }
    const groupTotal = group.reduce((sum, slot) => sum + (slot.payment?.paidAmountCents ?? 0), 0);
    if (groupTotal % newValueCents === 0) {
      units.push(...toUnits(first, groupTotal, newValueCents));
      changed ||= groupTotal / newValueCents !== group.length;
      continue;
    }
    for (const slot of group) {
      if (!slot.payment) {
        continue;
      }
      if (slot.payment.paidAmountCents % newValueCents === 0) {
        units.push(...toUnits(slot.payment, slot.payment.paidAmountCents, newValueCents));
        changed ||= slot.payment.paidAmountCents !== newValueCents;
      } else {
        units.push({ amountCents: slot.amountCents, payment: slot.payment });
      }
    }
  }

  if (!changed || units.length > ordered.length) {
    return keepPaidAsIs;
  }

  return {
    installments: ordered.map((slot, index) => {
      const unit = units[index];
      return unit
        ? { id: slot.id, dueDate: slot.dueDate, ...unit }
        : { id: slot.id, dueDate: slot.dueDate, amountCents: newValueCents, payment: null };
    }),
    paymentsRedistributed: true,
  };
}
