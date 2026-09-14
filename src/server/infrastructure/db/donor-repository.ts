import { eq } from "drizzle-orm";
import type { DonorRepository } from "@/server/application/create-donor";
import type { DonorDetailRepository } from "@/server/application/get-donor";
import type { DonorStateReader as UpdateDonorStateReader } from "@/server/application/update-donor";
import type { DonorUpdateRepository } from "@/server/application/update-donor";
import type { DonorStateReader as AnonymizeDonorStateReader } from "@/server/application/anonymize-donor";
import type { DonorAnonymizeRepository } from "@/server/application/anonymize-donor";
import type { DbClient } from "./client";
import { donors } from "./schema";

export function createDonorRepository(
  db: DbClient,
): DonorRepository &
  DonorDetailRepository &
  UpdateDonorStateReader &
  AnonymizeDonorStateReader &
  DonorUpdateRepository &
  DonorAnonymizeRepository {
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

    async findById(id) {
      const [row] = await db.select().from(donors).where(eq(donors.id, id)).limit(1);

      if (!row) {
        return null;
      }
      return { name: row.name, anonymizedAt: row.anonymizedAt };
    },

    async findState(id) {
      const [row] = await db.select().from(donors).where(eq(donors.id, id)).limit(1);

      if (!row) {
        return null;
      }
      return { name: row.name, anonymizedAt: row.anonymizedAt };
    },

    async update(id, donor) {
      await db.update(donors).set({ name: donor.name }).where(eq(donors.id, id));
    },

    async anonymize(id, donor) {
      await db
        .update(donors)
        .set({ name: donor.name, anonymizedAt: donor.anonymizedAt })
        .where(eq(donors.id, id));
    },
  };
}
