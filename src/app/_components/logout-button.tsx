"use client";

import { useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { LogoutIcon } from "@/app/_components/icons";

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`${buttonBaseClassName} ${buttonClassNames.danger}`}
      >
        <LogoutIcon />
        Sair
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={action} className="flex flex-col gap-4">
          <p className="text-lg font-semibold">Deseja realmente sair?</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
