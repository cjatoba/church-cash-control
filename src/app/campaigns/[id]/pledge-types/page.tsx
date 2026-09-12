import Link from "next/link";
import { createPledgeType } from "@/server/application/create-pledge-type";
import { listPledgeTypes } from "@/server/application/list-pledge-types";
import { createPledgeTypeRepository } from "@/server/infrastructure/db/pledge-type-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { PledgeTypeForm, type CreatePledgeTypeState } from "./pledge-type-form";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function PledgeTypesPage({
  params,
}: PageProps<"/campaigns/[id]/pledge-types">) {
  const { id: campaignId } = await params;
  const db = createDbClient();
  const repository = createPledgeTypeRepository(db);
  const pledgeTypes = await listPledgeTypes(repository, campaignId);

  async function create(
    _prevState: CreatePledgeTypeState,
    formData: FormData,
  ): Promise<CreatePledgeTypeState> {
    "use server";

    const input = {
      campaignId,
      name: formData.get("name"),
      installmentValue: formData.get("installmentValue"),
    };

    try {
      const db = createDbClient();
      const repository = createPledgeTypeRepository(db);
      const { id } = await createPledgeType(repository, input);
      return { success: id };
    } catch {
      return { error: "Não foi possível criar o tipo de carnê. Confira os dados informados." };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Tipos de carnê</h1>

        {pledgeTypes.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum tipo de carnê cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pledgeTypes.map((pledgeType) => (
              <li
                key={pledgeType.id}
                className="flex items-center justify-between rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
              >
                <span>
                  {pledgeType.name}{" "}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    · {currencyFormatter.format(pledgeType.installmentValue.toCents() / 100)}/mês
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <PledgeTypeForm action={create} />
      </div>
    </div>
  );
}
