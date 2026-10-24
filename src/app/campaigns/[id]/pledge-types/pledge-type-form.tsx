"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface CreatePledgeTypeState {
  error?: string;
  success?: string;
  values?: { name: string; installmentValue: string; isLoose: boolean };
}

export function PledgeTypeForm({
  action,
}: {
  action: (prevState: CreatePledgeTypeState, formData: FormData) => Promise<CreatePledgeTypeState>;
}) {
  const [state, formAction] = useActionState<CreatePledgeTypeState, FormData>(action, {});
  const [isLoose, setIsLoose] = useState(state.values?.isLoose ?? false);

  return (
    <form
      key={state.success ?? "form"}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Novo tipo de carnê</h2>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-green-50 p-3 text-[15px] text-green-800 dark:bg-green-950/50 dark:text-green-300">
          Tipo de carnê criado com sucesso.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Nome
        <input
          name="name"
          type="text"
          required
          defaultValue={state.values?.name ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-base text-zinc-700 dark:text-zinc-300">
        <input
          name="isLoose"
          type="checkbox"
          checked={isLoose}
          onChange={(event) => {
            setIsLoose(event.target.checked);
          }}
        />
        Carnê avulso (sem valor fixo — a pessoa arrecada e entrega o quanto conseguir)
      </label>
      {!isLoose ? (
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Valor da parcela (R$/mês)
          <input
            name="installmentValue"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={state.values?.installmentValue ?? ""}
            className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      ) : null}
      <SubmitButton pendingLabel="Criando…">Criar tipo de carnê</SubmitButton>
    </form>
  );
}
