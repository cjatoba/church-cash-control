"use client";

import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { PrinterIcon } from "@/app/_components/icons";

export function PrintButton() {
  return (
    <div className="flex flex-col gap-2 print:hidden">
      <button
        type="button"
        onClick={() => {
          window.print();
        }}
        className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
      >
        <PrinterIcon />
        Imprimir ou salvar PDF
      </button>
      <p className="px-1 text-[15px] text-zinc-600 dark:text-zinc-400">
        Abre a impressão do celular. Para guardar o arquivo, escolha &quot;Salvar como PDF&quot;.
      </p>
    </div>
  );
}
