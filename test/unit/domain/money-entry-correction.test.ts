import { describe, expect, it } from "vitest";
import {
  assertEntryChangeKeepsBalance,
  FundsAlreadyTransferredError,
} from "@/server/domain/money-entry-correction";
import { Money } from "@/server/domain/money";

const entry = { amount: Money.fromReais(5000), receivedByUserId: "user-a" };

describe("assertEntryChangeKeepsBalance", () => {
  it("permite trocar quem recebeu enquanto o dinheiro ainda está com essa pessoa", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        entry,
        { amount: Money.fromReais(5000), receivedByUserId: "user-b" },
        Money.fromReais(5000),
      );
    }).not.toThrow();
  });

  it("não deixa tirar a entrada de quem já repassou o dinheiro, para o saldo em mãos não ficar negativo", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        entry,
        { amount: Money.fromReais(5000), receivedByUserId: "user-b" },
        Money.fromReais(4000),
      );
    }).toThrow("Corrija o repasse primeiro");
  });

  it("diz de quem é o saldo que ficaria negativo, para a tela levar aos repasses dessa pessoa", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(entry, null, Money.fromReais(4000));
    }).toThrow(expect.objectContaining({ receiverUserId: "user-a" }));
    expect(() => {
      assertEntryChangeKeepsBalance(entry, null, Money.fromReais(4000));
    }).toThrow(FundsAlreadyTransferredError);
  });

  it("permite diminuir o valor quando a diferença ainda está em mãos", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        entry,
        { amount: Money.fromReais(500), receivedByUserId: "user-a" },
        Money.fromReais(4500),
      );
    }).not.toThrow();
  });

  it("não deixa diminuir o valor além do que ainda está em mãos", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        entry,
        { amount: Money.fromReais(500), receivedByUserId: "user-a" },
        Money.fromReais(4000),
      );
    }).toThrow("saldo em mãos");
  });

  it("sempre permite aumentar o valor recebido pela mesma pessoa", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        entry,
        { amount: Money.fromReais(6000), receivedByUserId: "user-a" },
        Money.fromCents(0),
      );
    }).not.toThrow();
  });

  it("não deixa excluir uma entrada cujo dinheiro já foi repassado", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(entry, null, Money.fromReais(100));
    }).toThrow("saldo em mãos");
    expect(() => {
      assertEntryChangeKeepsBalance(entry, null, Money.fromReais(5000));
    }).not.toThrow();
  });

  it("não trava entradas antigas sem ninguém registrado como recebedor", () => {
    expect(() => {
      assertEntryChangeKeepsBalance(
        { amount: Money.fromReais(100), receivedByUserId: null },
        null,
        Money.fromCents(0),
      );
    }).not.toThrow();
  });
});
