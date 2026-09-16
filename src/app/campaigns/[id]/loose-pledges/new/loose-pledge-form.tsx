"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";

export interface CreateLoosePledgeState {
  error?: string;
  values?: { name: string };
}

export function LoosePledgeForm({
  campaignId,
  action,
}: {
  campaignId: string;
  action: (
    prevState: CreateLoosePledgeState,
    formData: FormData,
  ) => Promise<CreateLoosePledgeState>;
}) {
  const [state, formAction] = useActionState<CreateLoosePledgeState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <BackLink href={`/campaigns/${campaignId}/loose-pledges`} />
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Novo carnê avulso</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Nome de quem vai arrecadar
        <input
          name="name"
          type="text"
          required
          defaultValue={state.values?.name ?? ""}
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Sem valor fixo — quem levar o carnê arrecada com quem quiser e entrega o valor depois, em
        uma ou mais vezes.
      </p>
      <SubmitButton pendingLabel="Cadastrando…">Cadastrar carnê avulso</SubmitButton>
    </form>
  );
}
