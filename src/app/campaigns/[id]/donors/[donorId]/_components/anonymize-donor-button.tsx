"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { TrashIcon } from "@/app/_components/icons";

export function AnonymizeDonorButton({ action }: { action: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);

  function openDialog() {
    setConfirming(false);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center gap-1.5 self-start inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-5 text-base font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <TrashIcon className="h-4 w-4" />
        Excluir dados do doador
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {!confirming ? (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Excluir dados do doador</p>
            <p className="text-zinc-700 dark:text-zinc-300">
              O nome será removido permanentemente. O histórico de carnês e parcelas pagas é
              mantido, mas sem vínculo com o nome. Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(true);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-5 text-base font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <p className="text-red-700 dark:text-red-400">
              Confirme novamente: o nome deste doador será apagado e não pode ser recuperado.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <SubmitButton pendingLabel="Excluindo…">
                <TrashIcon className="h-4 w-4" />
                Excluir definitivamente
              </SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
