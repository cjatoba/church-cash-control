"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface CreateCampaignState {
  error?: string;
}

export function CampaignForm({
  action,
}: {
  action: (prevState: CreateCampaignState, formData: FormData) => Promise<CreateCampaignState>;
}) {
  const [state, formAction] = useActionState<CreateCampaignState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nova campanha</h1>
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
      <SubmitButton pendingLabel="Criando…">Criar campanha</SubmitButton>
    </form>
  );
}
