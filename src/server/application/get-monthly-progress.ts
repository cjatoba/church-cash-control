import {
  calculateMonthlyGoal,
  type MonthlyContribution,
  type MonthlyProgress,
} from "../domain/monthly-progress";
import { Money } from "../domain/money";

export interface CampaignGoalPeriodReader {
  findById(campaignId: string): Promise<{ goal: Money; startDate: Date; endDate: Date } | null>;
}

export interface InstallmentDueInMonth {
  donorName: string;
  amount: Money;
  paidAt: Date | null;
  paidAmount: Money | null;
}

export interface InstallmentsForMonthReader {
  findDueInMonth(campaignId: string, month: Date): Promise<InstallmentDueInMonth[]>;
}

export interface OneOffDonationInMonth {
  donorName: string | null;
  amount: Money;
}

export interface OneOffDonationsForMonthReader {
  findInMonth(campaignId: string, month: Date): Promise<OneOffDonationInMonth[]>;
}

export interface GetMonthlyProgressDependencies {
  campaignReader: CampaignGoalPeriodReader;
  installmentsReader: InstallmentsForMonthReader;
  oneOffDonationsReader: OneOffDonationsForMonthReader;
}

export async function getMonthlyProgress(
  dependencies: GetMonthlyProgressDependencies,
  campaignId: string,
  month: Date,
): Promise<MonthlyProgress> {
  const campaign = await dependencies.campaignReader.findById(campaignId);
  if (!campaign) {
    throw new Error("Campanha não encontrada");
  }

  const monthlyGoal = calculateMonthlyGoal(campaign.goal, campaign.startDate, campaign.endDate);

  const [installmentsDue, oneOffDonations] = await Promise.all([
    dependencies.installmentsReader.findDueInMonth(campaignId, month),
    dependencies.oneOffDonationsReader.findInMonth(campaignId, month),
  ]);

  const paid: MonthlyContribution[] = [
    ...installmentsDue
      .filter((installment) => installment.paidAt)
      .map((installment) => ({
        donorName: installment.donorName,
        amount: installment.paidAmount ?? installment.amount,
      })),
    ...oneOffDonations.map((donation) => ({
      donorName: donation.donorName ?? "Anônimo",
      amount: donation.amount,
    })),
  ];

  const pending: MonthlyContribution[] = installmentsDue
    .filter((installment) => !installment.paidAt)
    .map((installment) => ({ donorName: installment.donorName, amount: installment.amount }));

  const receivedTotal = paid.reduce(
    (sum, contribution) => sum.add(contribution.amount),
    Money.fromCents(0),
  );

  return { month, monthlyGoal, receivedTotal, paid, pending };
}
