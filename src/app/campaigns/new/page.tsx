import { redirect } from "next/navigation";
import { createCampaign } from "@/server/application/create-campaign";
import { createCampaignRepository } from "@/server/infrastructure/db/campaign-repository";
import { createDbClient } from "@/server/infrastructure/db/client";

export default async function NewCampaignPage({ searchParams }: PageProps<"/campaigns/new">) {
  const { error, created } = await searchParams;

  async function create(formData: FormData): Promise<void> {
    "use server";

    const input = {
      name: formData.get("name"),
      goal: formData.get("goal"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    };

    try {
      const db = createDbClient();
      const repository = createCampaignRepository(db);
      await createCampaign(repository, input);
    } catch {
      redirect("/campaigns/new?error=1");
    }

    redirect("/campaigns/new?created=1");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={create}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nova campanha</h1>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível criar a campanha. Confira os dados informados.
          </p>
        ) : null}
        {created ? (
          <p className="text-sm text-green-600 dark:text-green-400">Campanha criada com sucesso.</p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Nome
          <input
            name="name"
            type="text"
            required
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Meta (R$)
          <input
            name="goal"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Início
          <input
            name="startDate"
            type="date"
            required
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Término
          <input
            name="endDate"
            type="date"
            required
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Criar campanha
        </button>
      </form>
    </div>
  );
}
