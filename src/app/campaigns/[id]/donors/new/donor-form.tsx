"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface CreateDonorState {
  error?: string;
}

export function DonorForm({
  campaignId,
  pledgeTypes,
  action,
}: {
  campaignId: string;
  pledgeTypes: { id: string; name: string; installmentValueLabel: string }[];
  action: (prevState: CreateDonorState, formData: FormData) => Promise<CreateDonorState>;
}) {
  const [state, formAction] = useActionState<CreateDonorState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <Link
        href={`/campaigns/${campaignId}/donors`}
        className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Voltar para doadores
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Novo doador</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
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
        Tipo de carnê
        <select
          name="pledgeTypeId"
          required
          defaultValue=""
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        >
          <option value="" disabled>
            Selecione
          </option>
          {pledgeTypes.map((pledgeType) => (
            <option key={pledgeType.id} value={pledgeType.id}>
              {pledgeType.name} · {pledgeType.installmentValueLabel}/mês
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        As parcelas mensais são geradas automaticamente, do mês atual até o fim da campanha.
      </p>
      <SubmitButton pendingLabel="Cadastrando…">Cadastrar doador e gerar carnê</SubmitButton>
    </form>
  );
}
