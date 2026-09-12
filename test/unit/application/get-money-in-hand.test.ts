import { describe, expect, it } from "vitest";
import { getMoneyInHand, type MoneyInHandReader } from "@/server/application/get-money-in-hand";

describe("getMoneyInHand", () => {
  it("calcula o saldo em mãos de cada usuário a partir dos totais recebidos e repassados", async () => {
    const reader: MoneyInHandReader = {
      getTotalsByCampaign() {
        return Promise.resolve([
          {
            userId: "user-1",
            userLabel: "clayton@example.com",
            receivedCents: 48000,
            transferredCents: 30000,
          },
          {
            userId: "user-2",
            userLabel: "voluntario2@example.com",
            receivedCents: 12000,
            transferredCents: 0,
          },
        ]);
      },
    };

    const balances = await getMoneyInHand(reader, "campaign-1");

    expect(balances).toHaveLength(2);
    expect(balances[0]?.userId).toBe("user-1");
    expect(balances[0]?.userLabel).toBe("clayton@example.com");
    expect(balances[0]?.balance.toCents()).toBe(18000);
    expect(balances[1]?.balance.toCents()).toBe(12000);
  });
});
