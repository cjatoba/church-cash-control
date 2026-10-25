import { describe, expect, it } from "vitest";
import { describeChanges, parseActivityLogEntry } from "@/server/domain/activity-log";
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
    expect(entry.details).toBeNull();
    expect(entry.donorId).toBeNull();
  });

  it("guarda a qual doador a atividade se refere, para poder apagar o nome dele depois", () => {
    const entry = parseActivityLogEntry({ ...validInput, donorId: "donor-1" }, occurredAt);

    expect(entry.donorId).toBe("donor-1");
  });

  it("guarda o detalhe do que mudou numa correção", () => {
    const entry = parseActivityLogEntry(
      { ...validInput, action: "one_off_donation_corrected", details: "Recebido por: A → B" },
      occurredAt,
    );

    expect(entry.details).toBe("Recebido por: A → B");
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

describe("describeChanges", () => {
  it("lista só os campos que mudaram, com o antes e o depois", () => {
    expect(
      describeChanges([
        { label: "Recebido por", before: "Carlos", after: "Ana" },
        { label: "Valor", before: "R$ 50,00", after: "R$ 50,00" },
        { label: "Forma", before: "Pix", after: "Dinheiro" },
      ]),
    ).toBe("Recebido por: Carlos → Ana · Forma: Pix → Dinheiro");
  });

  it("devolve null quando nada mudou", () => {
    expect(describeChanges([{ label: "Valor", before: "R$ 1,00", after: "R$ 1,00" }])).toBeNull();
  });
});
