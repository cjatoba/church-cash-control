import { z } from "zod";
import { repriceInstallments, type InstallmentSlot } from "../domain/installment-repricing";
import type { Pledge } from "../domain/pledge";
import { planPledgeTypeChange, type PledgeKind } from "../domain/pledge-type-change";
import {
  planPledgeInstallments,
  type CampaignPeriodReader,
  type PledgeTypeReader,
} from "./create-pledge";

const changePledgeTypeInputSchema = z.object({
  sourceKind: z.enum(["fixed", "loose"]),
  sourceId: z.string().trim().min(1, "Carnê é obrigatório"),
  pledgeTypeId: z.string().trim().min(1, "Escolha o novo tipo de carnê"),
  firstInstallmentMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Mês da primeira parcela inválido")
    .optional(),
  installmentCount: z.coerce
    .number()
    .int()
    .positive("Quantidade de parcelas deve ser maior que zero")
    .optional(),
});

export interface PledgeTypeChangeRepository {
  findSource(
    kind: PledgeKind,
    id: string,
  ): Promise<{
    campaignId: string;
    donorId: string;
    pledgeTypeId: string;
    hasPayments: boolean;
  } | null>;
  findInstallments(pledgeId: string): Promise<InstallmentSlot[]>;
  repriceFixed(
    pledgeId: string,
    pledgeTypeId: string,
    installments: InstallmentSlot[],
  ): Promise<void>;
  relabelLoose(loosePledgeId: string, pledgeTypeId: string): Promise<void>;
  convertFixedToLoose(
    pledgeId: string,
    loosePledge: { campaignId: string; donorId: string; pledgeTypeId: string },
  ): Promise<{ id: string }>;
  convertLooseToFixed(loosePledgeId: string, pledge: Pledge): Promise<{ id: string }>;
}

export function getPledgeTypeChangeSource(
  repository: Pick<PledgeTypeChangeRepository, "findSource">,
  kind: PledgeKind,
  id: string,
) {
  return repository.findSource(kind, id);
}

export function listPledgeInstallmentSlots(
  repository: Pick<PledgeTypeChangeRepository, "findInstallments">,
  pledgeId: string,
): Promise<InstallmentSlot[]> {
  return repository.findInstallments(pledgeId);
}

export interface ChangePledgeTypeDependencies {
  repository: PledgeTypeChangeRepository;
  pledgeTypeReader: PledgeTypeReader;
  campaignReader: CampaignPeriodReader;
}

export async function changePledgeType(
  dependencies: ChangePledgeTypeDependencies,
  input: unknown,
  now: Date = new Date(),
): Promise<{ kind: PledgeKind; id: string }> {
  const data = changePledgeTypeInputSchema.parse(input);
  const { repository } = dependencies;

  const source = await repository.findSource(data.sourceKind, data.sourceId);
  if (!source) {
    throw new Error("Carnê não encontrado");
  }

  const target = await dependencies.pledgeTypeReader.findById(data.pledgeTypeId);
  if (target?.campaignId !== source.campaignId) {
    throw new Error("Tipo de carnê inválido para esta campanha");
  }

  const plan = planPledgeTypeChange(
    { kind: data.sourceKind, pledgeTypeId: source.pledgeTypeId, hasPayments: source.hasPayments },
    { id: data.pledgeTypeId, installmentValue: target.installmentValue },
  );

  switch (plan.kind) {
    case "reprice": {
      const repriced = repriceInstallments(
        await repository.findInstallments(data.sourceId),
        plan.installmentValue.toCents(),
      );
      await repository.repriceFixed(data.sourceId, data.pledgeTypeId, repriced.installments);
      return { kind: "fixed", id: data.sourceId };
    }
    case "relabel":
      await repository.relabelLoose(data.sourceId, data.pledgeTypeId);
      return { kind: "loose", id: data.sourceId };
    case "toLoose": {
      const created = await repository.convertFixedToLoose(data.sourceId, {
        campaignId: source.campaignId,
        donorId: source.donorId,
        pledgeTypeId: data.pledgeTypeId,
      });
      return { kind: "loose", id: created.id };
    }
    case "toFixed": {
      const installments = await planPledgeInstallments(dependencies.campaignReader, {
        campaignId: source.campaignId,
        installmentValue: plan.installmentValue,
        firstInstallmentMonth: data.firstInstallmentMonth,
        installmentCount: data.installmentCount,
        now,
      });
      const created = await repository.convertLooseToFixed(data.sourceId, {
        campaignId: source.campaignId,
        donorId: source.donorId,
        pledgeTypeId: data.pledgeTypeId,
        installments,
      });
      return { kind: "fixed", id: created.id };
    }
  }
}
