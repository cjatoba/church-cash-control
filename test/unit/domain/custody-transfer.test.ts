import { describe, expect, it } from "vitest";
import {
  assertTransferWithinBalance,
  calculateAvailableBalance,
  parseCustodyTransferInput,
} from "@/server/domain/custody-transfer";
import { Money } from "@/server/domain/money";

describe("parseCustodyTransferInput", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    fromUserId: "user-1",
    recipientName: "Responsável pela compra",
    amount: 100,
    transferDate: "2026-03-10",
  };

  it("cria um repasse a partir de dados válidos", () => {
    const transfer = parseCustodyTransferInput(validInput);

    expect(transfer.campaignId).toBe(validInput.campaignId);
    expect(transfer.fromUserId).toBe("user-1");
    expect(transfer.recipientName).toBe("Responsável pela compra");
    expect(transfer.amount.toCents()).toBe(10000);
    expect(transfer.transferDate).toEqual(new Date("2026-03-10"));
    expect(transfer.description).toBeNull();
  });

  it("aceita descrição opcional", () => {
    const transfer = parseCustodyTransferInput({
      ...validInput,
      description: "Compra de cadeiras",
    });
    expect(transfer.description).toBe("Compra de cadeiras");
  });

  it("rejeita destinatário vazio", () => {
    expect(() => parseCustodyTransferInput({ ...validInput, recipientName: "" })).toThrow();
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => parseCustodyTransferInput({ ...validInput, amount: 0 })).toThrow();
    expect(() => parseCustodyTransferInput({ ...validInput, amount: -10 })).toThrow();
  });
});

describe("calculateAvailableBalance", () => {
  it("é o total recebido menos o total já repassado", () => {
    expect(calculateAvailableBalance(48000, 30000).toCents()).toBe(18000);
  });

  it("é zero quando nada foi recebido", () => {
    expect(calculateAvailableBalance(0, 0).toCents()).toBe(0);
  });
});

describe("assertTransferWithinBalance", () => {
  it("aceita repasse dentro do saldo disponível", () => {
    expect(() => {
      assertTransferWithinBalance(
        Money.fromReais(100),
        Money.fromReais(480),
        new Date("2026-03-10"),
        new Date("2026-03-10"),
      );
    }).not.toThrow();
  });

  it("rejeita repasse maior que o saldo disponível", () => {
    expect(() => {
      assertTransferWithinBalance(
        Money.fromReais(500),
        Money.fromReais(480),
        new Date("2026-03-10"),
        new Date("2026-03-10"),
      );
    }).toThrow();
  });

  it("rejeita data de repasse no futuro", () => {
    expect(() => {
      assertTransferWithinBalance(
        Money.fromReais(100),
        Money.fromReais(480),
        new Date("2026-03-11"),
        new Date("2026-03-10"),
      );
    }).toThrow();
  });
});
