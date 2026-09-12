"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function EditPaymentDateButton({
  installmentId,
  currentPaidAtIso,
  todayIso,
  correctAction,
  revertAction,
}: {
  installmentId: string;
  currentPaidAtIso: string;
  todayIso: string;
  correctAction: (formData: FormData) => Promise<void>;
  revertAction: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmingRevert, setConfirmingRevert] = useState(false);

  function openDialog() {
    setConfirmingRevert(false);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-full border border-black/[.08] px-3 py-1.5 text-sm text-zinc-600 hover:border-black/[.14] hover:text-black dark:border-white/[.145] dark:text-zinc-400 dark:hover:border-white/[.22] dark:hover:text-zinc-50"
      >
        Editar
      </button>
      <dialog
        ref={dialogRef}
        className="w-72 rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={correctAction} className="flex flex-col gap-4">
          <input type="hidden" name="installmentId" value={installmentId} />
          <p className="font-semibold">Corrigir pagamento</p>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Data do pagamento
            <input
              type="date"
              name="paidAt"
              defaultValue={currentPaidAtIso}
              max={todayIso}
              required
              autoFocus
              className="rounded border border-black/[.08] px-3 py-2.5 dark:border-white/[.145] dark:bg-black"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
            >
              Cancelar
            </button>
            <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
          </div>
        </form>

        <div className="my-4 border-t border-black/[.08] dark:border-white/[.145]" />

        {!confirmingRevert ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Deu baixa sem querer?</p>
            <button
              type="button"
              onClick={() => {
                setConfirmingRevert(true);
              }}
              className="rounded-full border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:border-red-400 dark:border-red-900 dark:text-red-400 dark:hover:border-red-800"
            >
              Reverter para pendente
            </button>
          </div>
        ) : (
          <form action={revertAction} className="flex flex-col gap-3">
            <input type="hidden" name="installmentId" value={installmentId} />
            <p className="text-sm text-red-700 dark:text-red-400">
              Tem certeza? Isso vai apagar o registro de pagamento desta parcela.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmingRevert(false);
                }}
                className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
              >
                Cancelar
              </button>
              <SubmitButton pendingLabel="Revertendo…">Sim, reverter para pendente</SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
