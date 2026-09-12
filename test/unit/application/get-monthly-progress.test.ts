import { describe, expect, it } from "vitest";
import {
  getMonthlyProgress,
  type CampaignGoalPeriodReader,
  type InstallmentDueInMonth,
  type InstallmentsForMonthReader,
  type OneOffDonationInMonth,
  type OneOffDonationsForMonthReader,
} from "@/server/application/get-monthly-progress";
import { Money } from "@/server/domain/money";

const campaignId = "campaign-1";
const month = new Date("2026-09-01");

function createDependencies(options?: {
  campaign?: { goal: Money; startDate: Date; endDate: Date } | null;
  installmentsDue?: InstallmentDueInMonth[];
  oneOffDonations?: OneOffDonationInMonth[];
}) {
  const campaignReader: CampaignGoalPeriodReader = {
    findById() {
      const campaign =
        options?.campaign === undefined
          ? {
              goal: Money.fromReais(600),
              startDate: new Date("2026-01-01"),
              endDate: new Date("2026-06-30"),
            }
          : options.campaign;
      return Promise.resolve(campaign);
    },
  };
  const installmentsReader: InstallmentsForMonthReader = {
    findDueInMonth() {
      return Promise.resolve(options?.installmentsDue ?? []);
    },
  };
  const oneOffDonationsReader: OneOffDonationsForMonthReader = {
    findInMonth() {
      return Promise.resolve(options?.oneOffDonations ?? []);
    },
  };

  return { campaignReader, installmentsReader, oneOffDonationsReader };
}

describe("getMonthlyProgress", () => {
  it("calcula a meta mensal a partir do período da campanha", async () => {
    const dependencies = createDependencies();

    const progress = await getMonthlyProgress(dependencies, campaignId, month);

    expect(progress.monthlyGoal.toCents()).toBe(10000);
  });

  it("separa parcelas pagas e doações avulsas em 'pagos', e parcelas não pagas em 'pendentes'", async () => {
    const dependencies = createDependencies({
      installmentsDue: [
        {
          donorName: "Maria Souza",
          amount: Money.fromReais(100),
          paidAt: new Date("2026-09-03"),
          paidAmount: Money.fromReais(100),
        },
        { donorName: "Ana Lima", amount: Money.fromReais(200), paidAt: null, paidAmount: null },
      ],
      oneOffDonations: [{ donorName: "João Pereira", amount: Money.fromReais(200) }],
    });

    const progress = await getMonthlyProgress(dependencies, campaignId, month);

    expect(progress.paid).toEqual([
      { donorName: "Maria Souza", amount: Money.fromReais(100) },
      { donorName: "João Pereira", amount: Money.fromReais(200) },
    ]);
    expect(progress.pending).toEqual([{ donorName: "Ana Lima", amount: Money.fromReais(200) }]);
    expect(progress.receivedTotal.toCents()).toBe(30000);
  });

  it("trata doação avulsa sem nome como anônima", async () => {
    const dependencies = createDependencies({
      oneOffDonations: [{ donorName: null, amount: Money.fromReais(50) }],
    });

    const progress = await getMonthlyProgress(dependencies, campaignId, month);

    expect(progress.paid).toEqual([{ donorName: "Anônimo", amount: Money.fromReais(50) }]);
  });

  it("rejeita quando a campanha não existe", async () => {
    const dependencies = createDependencies({ campaign: null });

    await expect(getMonthlyProgress(dependencies, campaignId, month)).rejects.toThrow();
  });
});
