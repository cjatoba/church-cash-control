import { describe, expect, it } from "vitest";
import {
  assertTransferChangeKeepsBalances,
  assertTransferDateNotInFuture,
  calculateAvailableBalance,
  parseCustodyTransferInput,
} from "@/server/domain/custody-transfer";
import { Money } from "@/server/domain/money";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";

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
    expect(transfer.toUserId).toBeNull();
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

  it("repasse para outro voluntário guarda quem recebeu, sem destinatário digitado", () => {
    const transfer = parseCustodyTransferInput({
      ...validInput,
      recipientName: "",
      toUserId: "user-2",
    });
    expect(transfer.toUserId).toBe("user-2");
    expect(transfer.recipientName).toBeNull();
  });

  it("não aceita repassar para si mesmo", () => {
    expect(() =>
      parseCustodyTransferInput({ ...validInput, recipientName: "", toUserId: "user-1" }),
    ).toThrow("pessoas diferentes");
  });

  it("não aceita voluntário e destinatário de fora ao mesmo tempo", () => {
    expect(() => parseCustodyTransferInput({ ...validInput, toUserId: "user-2" })).toThrow();
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

describe("assertTransferDateNotInFuture", () => {
  it("aceita hoje e rejeita data no futuro", () => {
    const today = new Date("2026-03-10");
    expect(() => {
      assertTransferDateNotInFuture(new Date("2026-03-10"), today);
    }).not.toThrow();
    expect(() => {
      assertTransferDateNotInFuture(new Date("2026-03-11"), today);
    }).toThrow("no futuro");
  });
});

describe("assertTransferChangeKeepsBalances", () => {
  const balances = new Map([
    ["ana", Money.fromReais(480)],
    ["bruno", Money.fromReais(50)],
  ]);
  const balanceOf = (userId: string) => balances.get(userId) ?? Money.fromCents(0);

  it("aceita um repasse novo dentro do saldo de quem repassa", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        null,
        { fromUserId: "ana", toUserId: null, amount: Money.fromReais(480) },
        balanceOf,
      );
    }).not.toThrow();
  });

  it("rejeita um repasse novo maior que o saldo de quem repassa", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        null,
        { fromUserId: "ana", toUserId: "bruno", amount: Money.fromReais(481) },
        balanceOf,
      );
    }).toThrow("Valor do repasse maior que o saldo disponível");
  });

  it("ao corrigir, devolve o valor original a quem repassou antes de conferir o valor novo", () => {
    const original = { fromUserId: "bruno", toUserId: null, amount: Money.fromReais(200) };
    expect(() => {
      assertTransferChangeKeepsBalances(
        original,
        { ...original, amount: Money.fromReais(250) },
        balanceOf,
      );
    }).not.toThrow();
    expect(() => {
      assertTransferChangeKeepsBalances(
        original,
        { ...original, amount: Money.fromReais(251) },
        balanceOf,
      );
    }).toThrow("Valor do repasse maior que o saldo disponível");
  });

  it("confere o saldo inteiro da nova pessoa quando quem repassou muda", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        { fromUserId: "ana", toUserId: null, amount: Money.fromReais(100) },
        { fromUserId: "bruno", toUserId: null, amount: Money.fromReais(100) },
        balanceOf,
      );
    }).toThrow("Valor do repasse maior que o saldo disponível");
  });

  it("não deixa tirar de um voluntário o repasse que ele já passou adiante", () => {
    const internal = { fromUserId: "ana", toUserId: "bruno", amount: Money.fromReais(300) };
    const attempt = () => {
      assertTransferChangeKeepsBalances(internal, null, balanceOf);
    };
    expect(attempt).toThrow(FundsAlreadyTransferredError);
    expect(attempt).toThrow(expect.objectContaining({ receiverUserId: "bruno" }));
  });

  it("permite excluir o repasse para um voluntário enquanto o dinheiro ainda está com ele", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        { fromUserId: "ana", toUserId: "bruno", amount: Money.fromReais(50) },
        null,
        balanceOf,
      );
    }).not.toThrow();
  });

  it("trocar o voluntário que recebeu tira o valor de quem recebia antes", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        { fromUserId: "ana", toUserId: "bruno", amount: Money.fromReais(300) },
        { fromUserId: "ana", toUserId: "carla", amount: Money.fromReais(300) },
        balanceOf,
      );
    }).toThrow(FundsAlreadyTransferredError);
  });

  it("excluir um repasse para fora da equipe só devolve o valor, nunca bloqueia", () => {
    expect(() => {
      assertTransferChangeKeepsBalances(
        { fromUserId: "carla", toUserId: null, amount: Money.fromReais(900) },
        null,
        balanceOf,
      );
    }).not.toThrow();
  });
});
