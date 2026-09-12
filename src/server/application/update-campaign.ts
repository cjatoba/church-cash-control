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

export async function updateCampaign(
  dependencies: UpdateCampaignDependencies,
  id: string,
  input: unknown,
): Promise<void> {
  const campaign = parseCampaign(input);
  await dependencies.campaignRepository.update(id, campaign);

  const installments = await dependencies.installmentsReader.findInstallmentsByCampaign(id);
  const idsToRemove = selectInstallmentsOutsidePeriod(installments, campaign.endDate);
  if (idsToRemove.length > 0) {
    await dependencies.installmentsRemover.removeMany(idsToRemove);
  }
}
