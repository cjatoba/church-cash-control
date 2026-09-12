"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type SubmitEvent } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import {
  selectInstallmentsOutsidePeriod,
  type PendingInstallmentCandidate,
} from "@/server/domain/pledge";

export interface CreateCampaignState {
  error?: string;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CampaignForm({
  action,
  heading = "Nova campanha",
  submitLabel = "Criar campanha",
  pendingLabel = "Criando…",
  defaultValues,
  pendingInstallments,
}: {
  action: (prevState: CreateCampaignState, formData: FormData) => Promise<CreateCampaignState>;
  heading?: string;
  submitLabel?: string;
  pendingLabel?: string;
  defaultValues?: { name: string; goal: number; startDate: Date; endDate: Date };
  pendingInstallments?: PendingInstallmentCandidate[];
}) {
  const [state, formAction] = useActionState<CreateCampaignState, FormData>(action, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingSubmitRef = useRef<FormData | null>(null);
  const [affectedCount, setAffectedCount] = useState(0);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    if (!pendingInstallments) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const endDateValue = formData.get("endDate");
    if (typeof endDateValue !== "string") {
      return;
    }
    const newEndDate = new Date(endDateValue);
    const removed = selectInstallmentsOutsidePeriod(pendingInstallments, newEndDate);

    if (removed.length > 0) {
      event.preventDefault();
      pendingSubmitRef.current = formData;
      setAffectedCount(removed.length);
      dialogRef.current?.showModal();
    }
  }

  function confirmSubmit() {
    dialogRef.current?.close();
    if (pendingSubmitRef.current) {
      formAction(pendingSubmitRef.current);
    }
  }

  return (
    <>
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <Link
          href="/"
          className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar para o painel
        </Link>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{heading}</h1>
        {state.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Nome
          <input
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
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
            defaultValue={defaultValues?.goal}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Início
          <input
            name="startDate"
            type="date"
            required
            defaultValue={defaultValues ? toDateInputValue(defaultValues.startDate) : undefined}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Término
          <input
            name="endDate"
            type="date"
            required
            defaultValue={defaultValues ? toDateInputValue(defaultValues.endDate) : undefined}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </form>

      {pendingInstallments ? (
        <dialog
          ref={dialogRef}
          className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
        >
          <p className="mb-1 font-semibold">Confirmar alteração de período</p>
          <p className="mb-4 max-w-xs text-zinc-600 dark:text-zinc-400">
            Isso vai remover {affectedCount}{" "}
            {affectedCount === 1 ? "parcela pendente" : "parcelas pendentes"} que ainda{" "}
            {affectedCount === 1 ? "não foi paga" : "não foram pagas"}. Parcelas já pagas não são
            afetadas.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-1.5 text-xs text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmSubmit}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs text-background"
            >
              Remover parcelas e salvar
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
