import {
  generateInstallments,
  listFirstInstallmentMonths,
  parsePledgeInput,
  selectFirstInstallments,
  toMonthKey,
  type Installment,
  type Pledge,
} from "../domain/pledge";
import type { Money } from "../domain/money";

export interface CampaignPeriodReader {
  findPeriodById(campaignId: string): Promise<{ startDate: Date; endDate: Date } | null>;
}

export interface PledgeTypeReader {
  findById(
    pledgeTypeId: string,
  ): Promise<{ campaignId: string; installmentValue: Money | null } | null>;
}

export interface PledgeRepository {
  create(pledge: Pledge): Promise<{ id: string }>;
}

export interface CreatePledgeDependencies {
  campaignReader: CampaignPeriodReader;
  pledgeTypeReader: PledgeTypeReader;
  pledgeRepository: PledgeRepository;
}

export async function createPledge(
  dependencies: CreatePledgeDependencies,
  input: unknown,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const data = parsePledgeInput(input);

  const pledgeType = await dependencies.pledgeTypeReader.findById(data.pledgeTypeId);
  if (pledgeType?.campaignId !== data.campaignId) {
    throw new Error("Tipo de carnê inválido para esta campanha");
  }
  if (pledgeType.installmentValue === null) {
    throw new Error("Este tipo de carnê é avulso — use o cadastro de carnê avulso");
  }

  const installments = await planPledgeInstallments(dependencies.campaignReader, {
    campaignId: data.campaignId,
    installmentValue: pledgeType.installmentValue,
    firstInstallmentMonth: data.firstInstallmentMonth,
    installmentCount: data.installmentCount,
    now,
  });

  return dependencies.pledgeRepository.create({
    campaignId: data.campaignId,
    donorId: data.donorId,
    pledgeTypeId: data.pledgeTypeId,
    installments,
  });
}

/**
 * Parcelas de um carnê de valor fixo a partir do mês escolhido (padrão: o mês
 * atual), até o fim da campanha ou pela quantidade informada — usado tanto no
 * cadastro quanto ao converter um carnê avulso em valor fixo.
 */
export async function planPledgeInstallments(
  campaignReader: CampaignPeriodReader,
  params: {
    campaignId: string;
    installmentValue: Money;
    firstInstallmentMonth?: string;
    installmentCount?: number;
    now: Date;
  },
): Promise<Installment[]> {
  const campaign = await campaignReader.findPeriodById(params.campaignId);
  if (!campaign) {
    throw new Error("Campanha não encontrada");
  }

  const firstMonth =
    params.firstInstallmentMonth === undefined
      ? params.now
      : listFirstInstallmentMonths(campaign.startDate, campaign.endDate, params.now).find(
          (month) => toMonthKey(month) === params.firstInstallmentMonth,
        );
  if (!firstMonth) {
    throw new Error("Mês da primeira parcela deve estar entre o início da campanha e o mês atual");
  }

  const installments = generateInstallments({
    startDate: firstMonth,
    campaignEndDate: campaign.endDate,
    installmentValue: params.installmentValue,
  });

  if (installments.length === 0) {
    throw new Error("Campanha já encerrada — não é possível gerar parcelas");
  }

  return params.installmentCount === undefined
    ? installments
    : selectFirstInstallments(installments, params.installmentCount);
}
