"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

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
        className="self-start rounded-full border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:border-red-400 dark:border-red-900 dark:text-red-400 dark:hover:border-red-800"
      >
        Excluir dados do doador
      </button>
      <dialog
        ref={dialogRef}
        className="w-72 rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        {!confirming ? (
          <div className="flex flex-col gap-4">
            <p className="font-semibold">Excluir dados do doador</p>
            <p className="text-zinc-700 dark:text-zinc-300">
              O nome será removido permanentemente. O histórico de carnês e parcelas pagas é
              mantido, mas sem vínculo com o nome. Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(true);
                }}
                className="rounded-full border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:border-red-400 dark:border-red-900 dark:text-red-400 dark:hover:border-red-800"
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
                className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
              >
                Cancelar
              </button>
              <SubmitButton pendingLabel="Excluindo…">Excluir definitivamente</SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
