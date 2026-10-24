import {
  calculateAmountLeftToGoal,
  calculateCampaignProgressPercentage,
  type CampaignSummary,
} from "../domain/campaign";
import type { Money } from "../domain/money";

export interface CampaignOverview extends CampaignSummary {
  progressPercentage: number;
  amountLeftToGoal: Money;
}

export interface CampaignOverviewRepository {
  findSummaryById(id: string): Promise<CampaignSummary | null>;
}

export async function getCampaignOverview(
  repository: CampaignOverviewRepository,
  id: string,
): Promise<CampaignOverview | null> {
  const campaign = await repository.findSummaryById(id);
  if (!campaign) {
    return null;
  }
  return {
    ...campaign,
    progressPercentage: calculateCampaignProgressPercentage(campaign.raisedTotal, campaign.goal),
    amountLeftToGoal: calculateAmountLeftToGoal(campaign.raisedTotal, campaign.goal),
  };
}
