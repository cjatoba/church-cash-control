"use client";

import { useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function EditPaymentDateButton({
  installmentId,
  currentPaidAtIso,
  todayIso,
  action,
}: {
  installmentId: string;
  currentPaidAtIso: string;
  todayIso: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Editar
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex w-64 flex-col gap-4">
          <input type="hidden" name="installmentId" value={installmentId} />
          <p className="font-semibold">Corrigir data de pagamento</p>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Data do pagamento
            <input
              type="date"
              name="paidAt"
              defaultValue={currentPaidAtIso}
              max={todayIso}
              required
              autoFocus
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-1.5 text-xs text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
            >
              Cancelar
            </button>
            <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
