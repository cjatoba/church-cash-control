import { parseCampaign, type Campaign } from "../domain/campaign";
import {
  selectInstallmentsOutsidePeriod,
  type PendingInstallmentCandidate,
} from "../domain/pledge";

export interface CampaignUpdateRepository {
  update(id: string, campaign: Campaign): Promise<void>;
}

export interface CampaignInstallmentsReader {
  findInstallmentsByCampaign(campaignId: string): Promise<PendingInstallmentCandidate[]>;
}

export interface InstallmentsRemover {
  removeMany(installmentIds: string[]): Promise<void>;
}

export interface UpdateCampaignDependencies {
  campaignRepository: CampaignUpdateRepository;
  installmentsReader: CampaignInstallmentsReader;
  installmentsRemover: InstallmentsRemover;
}

export interface UpdateCampaignOutcome {
  removedInstallmentsCount: number;
  periodExtended: boolean;
}

export async function updateCampaign(
  dependencies: UpdateCampaignDependencies,
  id: string,
  input: unknown,
  previousEndDate: Date,
): Promise<UpdateCampaignOutcome> {
  const campaign = parseCampaign(input);
  await dependencies.campaignRepository.update(id, campaign);

  const installments = await dependencies.installmentsReader.findInstallmentsByCampaign(id);
  const idsToRemove = selectInstallmentsOutsidePeriod(installments, campaign.endDate);
  if (idsToRemove.length > 0) {
    await dependencies.installmentsRemover.removeMany(idsToRemove);
  }

  return {
    removedInstallmentsCount: idsToRemove.length,
    periodExtended: campaign.endDate > previousEndDate && installments.length > 0,
  };
}
