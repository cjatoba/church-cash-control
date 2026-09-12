import { describe, expect, it } from "vitest";
import { parseOneOffDonation } from "@/server/domain/one-off-donation";

describe("parseOneOffDonation", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorName: "João Pereira",
    amount: 50,
    date: "2026-03-10",
    paymentMethod: "pix",
    receivedByUserId: "user-1",
  };
  const registeredByUserId = "user-1";

  it("cria uma doação avulsa a partir de dados válidos", () => {
    const donation = parseOneOffDonation(validInput, registeredByUserId);

    expect(donation.campaignId).toBe(validInput.campaignId);
    expect(donation.donorName).toBe("João Pereira");
    expect(donation.amount.toCents()).toBe(5000);
    expect(donation.date).toEqual(new Date("2026-03-10"));
    expect(donation.paymentMethod).toBe("pix");
    expect(donation.receivedByUserId).toBe("user-1");
    expect(donation.registeredByUserId).toBe("user-1");
  });

  it("registra quem recebeu de forma independente de quem registrou", () => {
    const donation = parseOneOffDonation({ ...validInput, receivedByUserId: "user-2" }, "user-1");

    expect(donation.receivedByUserId).toBe("user-2");
    expect(donation.registeredByUserId).toBe("user-1");
  });

  it("trata nome de doador vazio ou ausente como anônimo (null)", () => {
    expect(
      parseOneOffDonation({ ...validInput, donorName: "" }, registeredByUserId).donorName,
    ).toBeNull();

    const withoutName = {
      campaignId: validInput.campaignId,
      amount: validInput.amount,
      date: validInput.date,
      paymentMethod: validInput.paymentMethod,
      receivedByUserId: validInput.receivedByUserId,
    };
    expect(parseOneOffDonation(withoutName, registeredByUserId).donorName).toBeNull();
  });

  it("rejeita campanha vazia", () => {
    expect(() =>
      parseOneOffDonation({ ...validInput, campaignId: "" }, registeredByUserId),
    ).toThrow();
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => parseOneOffDonation({ ...validInput, amount: 0 }, registeredByUserId)).toThrow();
    expect(() => parseOneOffDonation({ ...validInput, amount: -10 }, registeredByUserId)).toThrow();
  });

  it("rejeita forma de pagamento desconhecida", () => {
    expect(() =>
      parseOneOffDonation({ ...validInput, paymentMethod: "boleto" }, registeredByUserId),
    ).toThrow();
  });

  it("rejeita recebedor vazio", () => {
    expect(() =>
      parseOneOffDonation({ ...validInput, receivedByUserId: "" }, registeredByUserId),
    ).toThrow();
  });
});
