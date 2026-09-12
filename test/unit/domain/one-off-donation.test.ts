import { describe, expect, it } from "vitest";
import { parseOneOffDonation } from "@/server/domain/one-off-donation";

describe("parseOneOffDonation", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorName: "João Pereira",
    amount: 50,
    date: "2026-03-10",
  };

  it("cria uma doação avulsa a partir de dados válidos", () => {
    const donation = parseOneOffDonation(validInput);

    expect(donation.campaignId).toBe(validInput.campaignId);
    expect(donation.donorName).toBe("João Pereira");
    expect(donation.amount.toCents()).toBe(5000);
    expect(donation.date).toEqual(new Date("2026-03-10"));
  });

  it("trata nome de doador vazio ou ausente como anônimo (null)", () => {
    expect(parseOneOffDonation({ ...validInput, donorName: "" }).donorName).toBeNull();

    const withoutName = {
      campaignId: validInput.campaignId,
      amount: validInput.amount,
      date: validInput.date,
    };
    expect(parseOneOffDonation(withoutName).donorName).toBeNull();
  });

  it("rejeita campanha vazia", () => {
    expect(() => parseOneOffDonation({ ...validInput, campaignId: "" })).toThrow();
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => parseOneOffDonation({ ...validInput, amount: 0 })).toThrow();
    expect(() => parseOneOffDonation({ ...validInput, amount: -10 })).toThrow();
  });
});
