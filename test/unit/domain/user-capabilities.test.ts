import { describe, expect, it } from "vitest";
import { resolveCapabilitiesForUpdate } from "@/server/domain/user-capabilities";

describe("resolveCapabilitiesForUpdate", () => {
  it("aplica as capacidades solicitadas quando o alvo não é quem está editando", () => {
    const capabilities = resolveCapabilitiesForUpdate(
      "admin-1",
      "user-2",
      { canManageUsers: false, canManageCampaigns: false, canReceiveFunds: true },
      { canManageUsers: true, canManageCampaigns: true, canReceiveFunds: false },
    );

    expect(capabilities).toEqual({
      canManageUsers: true,
      canManageCampaigns: true,
      canReceiveFunds: false,
    });
  });

  it("ignora canManageUsers solicitado quando o usuário edita a própria conta, mas aplica as demais", () => {
    const capabilities = resolveCapabilitiesForUpdate(
      "admin-1",
      "admin-1",
      { canManageUsers: true, canManageCampaigns: false, canReceiveFunds: false },
      { canManageUsers: false, canManageCampaigns: true, canReceiveFunds: true },
    );

    expect(capabilities).toEqual({
      canManageUsers: true,
      canManageCampaigns: true,
      canReceiveFunds: true,
    });
  });
});
