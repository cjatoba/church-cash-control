import { describe, expect, it } from "vitest";
import { detectMobilePlatform } from "@/app/_lib/mobile-platform";

describe("detectMobilePlatform", () => {
  it("reconhece iPhone", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

    expect(detectMobilePlatform(userAgent)).toBe("ios");
  });

  it("reconhece iPad", () => {
    const userAgent =
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

    expect(detectMobilePlatform(userAgent)).toBe("ios");
  });

  it("reconhece Android", () => {
    const userAgent =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

    expect(detectMobilePlatform(userAgent)).toBe("android");
  });

  it("trata computador e navegador desconhecido como outro", () => {
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      ),
    ).toBe("other");
    expect(detectMobilePlatform("")).toBe("other");
  });
});
