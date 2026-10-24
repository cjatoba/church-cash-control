"use client";

import { useActionState, useRef, useState, type SubmitEvent } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";
import {
  selectInstallmentsOutsidePeriod,
  type PendingInstallmentCandidate,
} from "@/server/domain/pledge";

export interface CreateCampaignState {
  error?: string;
  values?: { name: string; goal: string; startDate: string; endDate: string };
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
  backHref = "/",
}: {
  action: (prevState: CreateCampaignState, formData: FormData) => Promise<CreateCampaignState>;
  heading?: string;
  submitLabel?: string;
  pendingLabel?: string;
  defaultValues?: { name: string; goal: number; startDate: Date; endDate: Date };
  pendingInstallments?: PendingInstallmentCandidate[];
  backHref?: string;
}) {
  const [state, formAction] = useActionState<CreateCampaignState, FormData>(action, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingSubmitRef = useRef<FormData | null>(null);
  const [affectedCount, setAffectedCount] = useState(0);

  const name = state.values?.name ?? defaultValues?.name ?? "";
  const goal = state.values?.goal ?? (defaultValues ? String(defaultValues.goal) : "");
  const startDate =
    state.values?.startDate ?? (defaultValues ? toDateInputValue(defaultValues.startDate) : "");
  const endDate =
    state.values?.endDate ?? (defaultValues ? toDateInputValue(defaultValues.endDate) : "");

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
        className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <BackLink href={backHref} />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{heading}</h1>
        {state.error ? (
          <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
            {state.error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Nome
          <input
            name="name"
            type="text"
            required
            defaultValue={name}
            className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Meta (R$)
          <input
            name="goal"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={goal}
            className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Início
          <input
            name="startDate"
            type="date"
            required
            defaultValue={startDate}
            className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Término
          <input
            name="endDate"
            type="date"
            required
            defaultValue={endDate}
            className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </form>

      {pendingInstallments ? (
        <dialog
          ref={dialogRef}
          className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <p className="mb-1 font-semibold">Confirmar alteração de período</p>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            Isso vai remover {affectedCount}{" "}
            {affectedCount === 1 ? "parcela pendente" : "parcelas pendentes"} que ainda{" "}
            {affectedCount === 1 ? "não foi paga" : "não foram pagas"}. Parcelas já pagas não são
            afetadas.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={confirmSubmit}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Remover parcelas e salvar
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
