import type { Money } from "./money";

// Carrega quem recebeu o dinheiro para a tela levar direto aos repasses
// dessa pessoa, que é onde a correção precisa começar.
export class FundsAlreadyTransferredError extends Error {
  constructor(
    message: string,
    readonly receiverUserId: string,
  ) {
    super(message);
    this.name = "FundsAlreadyTransferredError";
  }
}

export interface ReceivedAmount {
  amount: Money;
  receivedByUserId: string | null;
}

/**
 * Corrigir ou excluir uma entrada tira o valor de quem recebeu. Se essa
 * pessoa já repassou o dinheiro, o saldo em mãos dela ficaria negativo e
 * "Dinheiro em mãos" deixaria de bater com o que cada um tem de fato — por
 * isso o repasse precisa ser corrigido antes.
 */
export function assertEntryChangeKeepsBalance(
  before: ReceivedAmount,
  after: ReceivedAmount | null,
  previousReceiverBalance: Money,
): void {
  if (!before.receivedByUserId) {
    return;
  }
  const keptCents =
    after?.receivedByUserId === before.receivedByUserId ? after.amount.toCents() : 0;
  const remainingCents = previousReceiverBalance.toCents() - before.amount.toCents() + keptCents;
  if (remainingCents < 0) {
    throw new FundsAlreadyTransferredError(
      "Não dá para fazer esta correção: parte desse dinheiro já foi repassada e o saldo em mãos de quem recebeu ficaria negativo. Corrija o repasse primeiro.",
      before.receivedByUserId,
    );
  }
}
