import { generateInstallments, parsePledgeInput, type Pledge } from "../domain/pledge";
import type { Money } from "../domain/money";

export interface CampaignPeriodReader {
  findPeriodById(campaignId: string): Promise<{ endDate: Date } | null>;
}

export interface PledgeTypeReader {
  findById(pledgeTypeId: string): Promise<{ campaignId: string; installmentValue: Money } | null>;
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

  const campaign = await dependencies.campaignReader.findPeriodById(data.campaignId);
  if (!campaign) {
    throw new Error("Campanha não encontrada");
  }

  const installments = generateInstallments({
    startDate: now,
    campaignEndDate: campaign.endDate,
    installmentValue: pledgeType.installmentValue,
  });

  if (installments.length === 0) {
    throw new Error("Campanha já encerrada — não é possível gerar parcelas");
  }

  return dependencies.pledgeRepository.create({
    campaignId: data.campaignId,
    donorId: data.donorId,
    pledgeTypeId: data.pledgeTypeId,
    installments,
  });
}
