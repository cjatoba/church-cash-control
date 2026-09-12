import { describe, expect, it } from "vitest";
import {
  createCustodyTransfer,
  type CustodyBalanceReader,
  type CustodyTransferRecord,
  type CustodyTransferRepository,
} from "@/server/application/create-custody-transfer";

function createDependencies(totals: { receivedCents: number; transferredCents: number }) {
  const saved: CustodyTransferRecord[] = [];
  const balanceReader: CustodyBalanceReader = {
    getAvailableBalance() {
      return Promise.resolve(totals);
    },
  };
  const repository: CustodyTransferRepository = {
    create(transfer) {
      saved.push(transfer);
      return Promise.resolve({ id: `transfer-${String(saved.length)}` });
    },
  };
  return { balanceReader, repository, saved };
}

describe("createCustodyTransfer", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    fromUserId: "user-1",
    recipientName: "Responsável pela compra",
    amount: 100,
    transferDate: "2026-03-10",
  };

  it("registra o repasse dentro do saldo disponível, com quem de fato registrou", async () => {
    const dependencies = createDependencies({ receivedCents: 48000, transferredCents: 30000 });

    const result = await createCustodyTransfer(
      dependencies,
      validInput,
      "user-1",
      new Date("2026-03-10"),
    );

    expect(result.id).toBe("transfer-1");
    expect(dependencies.saved).toHaveLength(1);
    expect(dependencies.saved[0]?.amount.toCents()).toBe(10000);
    expect(dependencies.saved[0]?.fromUserId).toBe("user-1");
    expect(dependencies.saved[0]?.registeredByUserId).toBe("user-1");
  });

  it("permite registrar em nome de outro usuário, mantendo quem de fato registrou", async () => {
    const dependencies = createDependencies({ receivedCents: 48000, transferredCents: 30000 });

    await createCustodyTransfer(
      dependencies,
      { ...validInput, fromUserId: "user-2" },
      "user-1",
      new Date("2026-03-10"),
    );

    expect(dependencies.saved[0]?.fromUserId).toBe("user-2");
    expect(dependencies.saved[0]?.registeredByUserId).toBe("user-1");
  });

  it("rejeita repasse maior que o saldo disponível, sem persistir nada", async () => {
    const dependencies = createDependencies({ receivedCents: 5000, transferredCents: 0 });

    await expect(
      createCustodyTransfer(dependencies, validInput, "user-1", new Date("2026-03-10")),
    ).rejects.toThrow();
    expect(dependencies.saved).toHaveLength(0);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const dependencies = createDependencies({ receivedCents: 48000, transferredCents: 0 });

    await expect(
      createCustodyTransfer(
        dependencies,
        { ...validInput, recipientName: "" },
        "user-1",
        new Date("2026-03-10"),
      ),
    ).rejects.toThrow();
    expect(dependencies.saved).toHaveLength(0);
  });
});
