import type { PaymentMethod } from "./payment-method";

export interface InstallmentPayment {
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
  payment: InstallmentPayment | null;
}

interface PaidUnit {
  amountCents: number;
  payment: InstallmentPayment;
}

function samePaymentOrigin(a: InstallmentPayment, b: InstallmentPayment): boolean {
  return (
    a.paidAt.toISOString().slice(0, 10) === b.paidAt.toISOString().slice(0, 10) &&
    a.paymentMethod === b.paymentMethod &&
    a.receivedByUserId === b.receivedByUserId &&
    a.registeredByUserId === b.registeredByUserId
  );
}

function groupConsecutive(paid: InstallmentSlot[]): InstallmentSlot[][] {
  const groups: InstallmentSlot[][] = [];
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

function toUnits(groupPayment: InstallmentPayment, totalCents: number, valueCents: number) {
  return Array.from({ length: totalCents / valueCents }, () => ({
    amountCents: valueCents,
    payment: { ...groupPayment, paidAmountCents: valueCents },
  }));
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
