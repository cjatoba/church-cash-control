"use client";

import { useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { PencilIcon } from "@/app/_components/icons";

export function EditDonorNameButton({
  currentName,
  action,
}: {
  currentName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <PencilIcon className="h-3.5 w-3.5" />
        Editar nome
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={action} className="flex flex-col gap-4">
          <p className="text-lg font-semibold">Corrigir nome do doador</p>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Nome
            <input
              type="text"
              name="name"
              defaultValue={currentName}
              required
              autoFocus
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
