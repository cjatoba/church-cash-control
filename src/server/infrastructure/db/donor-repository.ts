import type { DonorRepository } from "@/server/application/create-donor";
import type { DbClient } from "./client";
import { donors } from "./schema";

export function createDonorRepository(db: DbClient): DonorRepository {
  return {
    async create(donor) {
      const [row] = await db.insert(donors).values({ name: donor.name }).returning({
        id: donors.id,
      });

      if (!row) {
        throw new Error("Falha ao criar doador");
      }
      return row;
    },
  };
}
