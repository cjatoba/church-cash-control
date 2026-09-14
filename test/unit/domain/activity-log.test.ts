import { describe, expect, it } from "vitest";
import { parseActivityLogEntry } from "@/server/domain/activity-log";
import { Money } from "@/server/domain/money";

describe("parseActivityLogEntry", () => {
  const validInput = {
    actorUserId: "user-1",
    action: "installment_paid",
    subjectName: "Maria Souza",
    amountCents: 10000,
  };
  const occurredAt = new Date("2026-03-10T12:00:00Z");

  it("cria um registro válido a partir de dados válidos", () => {
    const entry = parseActivityLogEntry(validInput, occurredAt);

    expect(entry.actorUserId).toBe("user-1");
    expect(entry.action).toBe("installment_paid");
    expect(entry.subjectName).toBe("Maria Souza");
    expect(entry.amount?.equals(Money.fromReais(100))).toBe(true);
    expect(entry.occurredAt).toEqual(occurredAt);
  });

  it("aceita registro sem valor monetário associado (ex.: arquivar campanha)", () => {
    const entry = parseActivityLogEntry(
      { ...validInput, action: "campaign_archived", amountCents: null },
      occurredAt,
    );

    expect(entry.amount).toBeNull();
  });

  it("usa a data atual quando nenhuma é informada", () => {
    const entry = parseActivityLogEntry(validInput);

    expect(entry.occurredAt).toBeInstanceOf(Date);
  });

  it("rejeita usuário responsável vazio", () => {
    expect(() => parseActivityLogEntry({ ...validInput, actorUserId: "" })).toThrow();
  });

  it("rejeita nome do item vazio", () => {
    expect(() => parseActivityLogEntry({ ...validInput, subjectName: "" })).toThrow();
  });

  it("rejeita ação desconhecida", () => {
    expect(() => parseActivityLogEntry({ ...validInput, action: "unknown_action" })).toThrow();
  });
});
