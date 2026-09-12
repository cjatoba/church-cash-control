"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface CreatePledgeTypeState {
  error?: string;
  success?: string;
}

export function PledgeTypeForm({
  action,
}: {
  action: (prevState: CreatePledgeTypeState, formData: FormData) => Promise<CreatePledgeTypeState>;
}) {
  const [state, formAction] = useActionState<CreatePledgeTypeState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.145]"
    >
      <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Novo tipo de carnê</h2>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">
          Tipo de carnê criado com sucesso.
        </p>
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
        Valor da parcela (R$/mês)
        <input
          name="installmentValue"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <SubmitButton pendingLabel="Criando…">Criar tipo de carnê</SubmitButton>
    </form>
  );
}
