import { describe, expect, it } from "vitest";
import { parseTransactionCategory } from "@/server/domain/transaction-category";

describe("parseTransactionCategory", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    name: "Dízimo",
    type: "income",
  };

  it("cria uma categoria a partir de dados válidos", () => {
    const category = parseTransactionCategory(validInput);

    expect(category.campaignId).toBe(validInput.campaignId);
    expect(category.name).toBe("Dízimo");
    expect(category.type).toBe("income");
  });

  it("aceita o tipo saída", () => {
    const category = parseTransactionCategory({ ...validInput, type: "expense" });

    expect(category.type).toBe("expense");
  });

  it("rejeita nome vazio", () => {
    expect(() => parseTransactionCategory({ ...validInput, name: "" })).toThrow();
  });

  it("rejeita nome só com espaços", () => {
    expect(() => parseTransactionCategory({ ...validInput, name: "   " })).toThrow();
  });

  it("rejeita campanha vazia", () => {
    expect(() => parseTransactionCategory({ ...validInput, campaignId: "" })).toThrow();
  });

  it("rejeita tipo inválido", () => {
    expect(() => parseTransactionCategory({ ...validInput, type: "invalido" })).toThrow();
  });
});
