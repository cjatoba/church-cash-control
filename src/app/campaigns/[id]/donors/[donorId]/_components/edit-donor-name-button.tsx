"use client";

import { useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

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
        className="rounded-full border border-black/[.08] px-3 py-1.5 text-sm text-zinc-600 hover:border-black/[.14] hover:text-black dark:border-white/[.145] dark:text-zinc-400 dark:hover:border-white/[.22] dark:hover:text-zinc-50"
      >
        Editar nome
      </button>
      <dialog
        ref={dialogRef}
        className="w-72 rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex flex-col gap-4">
          <p className="font-semibold">Corrigir nome do doador</p>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Nome
            <input
              type="text"
              name="name"
              defaultValue={currentName}
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
      </dialog>
    </>
  );
}
