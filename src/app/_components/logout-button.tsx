"use client";

import { useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="hover:text-black dark:hover:text-zinc-50"
      >
        Sair
      </button>
      <dialog
        ref={dialogRef}
        className="w-72 rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex flex-col gap-4">
          <p className="font-semibold">Deseja realmente sair?</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
            >
              Cancelar
            </button>
            <SubmitButton pendingLabel="Saindo…">Sair</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
