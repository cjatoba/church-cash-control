import { describe, expect, it } from "vitest";
import {
  getDonor,
  type DonorDetail,
  type DonorDetailRepository,
} from "@/server/application/get-donor";

function createInMemoryDonorDetailRepository(donor: DonorDetail | null): DonorDetailRepository {
  return {
    findById() {
      return Promise.resolve(donor);
    },
  };
}

describe("getDonor", () => {
  it("retorna os dados do doador quando ele existe", async () => {
    const donor: DonorDetail = { name: "Maria Souza", anonymizedAt: null };
    const repository = createInMemoryDonorDetailRepository(donor);

    const result = await getDonor(repository, "donor-1");

    expect(result).toEqual(donor);
  });

  it("retorna null quando o doador não existe", async () => {
    const repository = createInMemoryDonorDetailRepository(null);

    const result = await getDonor(repository, "donor-1");

    expect(result).toBeNull();
  });
});
