import { describe, expect, it } from "vitest";
import { parsePaymentMethod } from "@/server/domain/payment-method";

describe("parsePaymentMethod", () => {
  it("aceita pix e cash", () => {
    expect(parsePaymentMethod("pix")).toBe("pix");
    expect(parsePaymentMethod("cash")).toBe("cash");
  });

  it("rejeita valor desconhecido", () => {
    expect(() => parsePaymentMethod("boleto")).toThrow();
  });
});
