import { describe, expect, it } from "vitest";
import {
  ANONYMIZED_DONOR_NAME,
  anonymizeDonor,
  parseDonor,
  updateDonorName,
  type DonorState,
} from "@/server/domain/donor";

describe("parseDonor", () => {
  it("cria um doador a partir de dados válidos", () => {
    const donor = parseDonor({ name: "Maria Souza" });

    expect(donor.name).toBe("Maria Souza");
  });

  it("rejeita nome vazio", () => {
    expect(() => parseDonor({ name: "" })).toThrow();
  });

  it("rejeita nome só com espaços", () => {
    expect(() => parseDonor({ name: "   " })).toThrow();
  });
});

describe("updateDonorName", () => {
  const activeDonor: DonorState = { name: "Maria Souza", anonymizedAt: null };

  it("corrige o nome de um doador ativo", () => {
    const donor = updateDonorName(activeDonor, { name: "Maria S. Souza" });

    expect(donor.name).toBe("Maria S. Souza");
  });

  it("rejeita nome vazio", () => {
    expect(() => updateDonorName(activeDonor, { name: "" })).toThrow();
  });

  it("rejeita corrigir o nome de um doador já removido", () => {
    const anonymizedDonor: DonorState = {
      name: ANONYMIZED_DONOR_NAME,
      anonymizedAt: new Date("2026-01-01"),
    };

    expect(() => updateDonorName(anonymizedDonor, { name: "Maria Souza" })).toThrow();
  });
});

describe("anonymizeDonor", () => {
  const activeDonor: DonorState = { name: "Maria Souza", anonymizedAt: null };

  it("substitui o nome por um rótulo genérico e marca a data de remoção", () => {
    const now = new Date("2026-03-10");

    const anonymized = anonymizeDonor(activeDonor, now);

    expect(anonymized.name).toBe(ANONYMIZED_DONOR_NAME);
    expect(anonymized.anonymizedAt).toEqual(now);
  });

  it("rejeita remover um doador que já foi removido", () => {
    const anonymizedDonor: DonorState = {
      name: ANONYMIZED_DONOR_NAME,
      anonymizedAt: new Date("2026-01-01"),
    };

    expect(() => anonymizeDonor(anonymizedDonor)).toThrow();
  });
});
