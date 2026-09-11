"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface CreateCategoryState {
  error?: string;
  success?: number;
}

export function CategoryForm({
  action,
}: {
  action: (prevState: CreateCategoryState, formData: FormData) => Promise<CreateCategoryState>;
}) {
  const [state, formAction] = useActionState<CreateCategoryState, FormData>(action, {});
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
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <Link
        href="/"
        className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Voltar para o painel
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nova categoria</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">
          Categoria criada com sucesso. Cadastre outra abaixo ou volte para o painel.
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
        Tipo
        <select
          name="type"
          required
          defaultValue=""
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
        </select>
      </label>
      <SubmitButton pendingLabel="Criando…">Criar categoria</SubmitButton>
    </form>
  );
}
