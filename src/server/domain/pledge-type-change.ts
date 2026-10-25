import type { Money } from "./money";

export type PledgeKind = "fixed" | "loose";

export interface PledgeTypeChangeSource {
  kind: PledgeKind;
  pledgeTypeId: string;
  hasPayments: boolean;
}

export interface PledgeTypeChangeTarget {
  id: string;
  installmentValue: Money | null;
}

export type PledgeTypeChangePlan =
  | { kind: "reprice"; installmentValue: Money }
  | { kind: "relabel" }
  | { kind: "toLoose" }
  | { kind: "toFixed"; installmentValue: Money };

// Entre tipos do mesmo jeito a troca vale sempre: o que já foi pago continua
// registrado com o valor pago. Converter entre valor fixo e avulso refaz o
// carnê do zero, então só é permitido enquanto não há pagamento a perder.
export function planPledgeTypeChange(
  source: PledgeTypeChangeSource,
  target: PledgeTypeChangeTarget,
): PledgeTypeChangePlan {
  if (source.pledgeTypeId === target.id) {
    throw new Error("Escolha um tipo de carnê diferente do atual");
  }

  const targetKind: PledgeKind = target.installmentValue === null ? "loose" : "fixed";
  if (targetKind !== source.kind && source.hasPayments) {
    throw new Error(
      "Este carnê já tem pagamento registrado — só dá para trocar por outro tipo do mesmo jeito (valor fixo ou avulso)",
    );
  }

  if (target.installmentValue === null) {
    return source.kind === "loose" ? { kind: "relabel" } : { kind: "toLoose" };
  }
  return source.kind === "fixed"
    ? { kind: "reprice", installmentValue: target.installmentValue }
    : { kind: "toFixed", installmentValue: target.installmentValue };
}
