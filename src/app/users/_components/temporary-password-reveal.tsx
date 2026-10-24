import Link from "next/link";
import type { ReactNode } from "react";
import { roundIconButtonClassName } from "@/app/_components/page-header";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { CheckCircleIcon, ChevronLeftIcon, PlusIcon, WhatsAppIcon } from "@/app/_components/icons";

export function TemporaryPasswordReveal({
  title,
  message,
  temporaryPassword,
  whatsappLink,
  backHref,
  secondaryAction,
}: {
  title: string;
  message: ReactNode;
  temporaryPassword: string;
  whatsappLink: string;
  backHref: string;
  secondaryAction?: { onClick: () => void; label: string };
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <header className="flex items-center gap-3">
        <Link href={backHref} aria-label="Voltar" className={roundIconButtonClassName}>
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-base text-green-900 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200">
        <CheckCircleIcon className="h-7 w-7 shrink-0 text-green-700 dark:text-green-400" />
        <p>{message}</p>
      </div>

      <section className="flex flex-col gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <span className="text-[13px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
          Senha temporária
        </span>
        <span className="font-mono text-[28px] font-medium tracking-wider text-zinc-900 dark:text-zinc-50">
          {temporaryPassword}
        </span>
        <span className="text-[15px] text-amber-800 dark:text-amber-300">
          Aparece só agora. Ela já vai junto na mensagem do WhatsApp, e a pessoa troca no primeiro
          acesso.
        </span>
      </section>

      <div className="flex flex-col gap-2">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-15 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-center text-[17px] leading-tight font-bold text-green-950 transition-colors hover:bg-[#1ebe57]"
        >
          <WhatsAppIcon className="h-6 w-6 shrink-0" />
          Enviar pelo WhatsApp
        </a>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Abre o WhatsApp com a mensagem pronta. É só conferir e enviar.
        </p>
      </div>

      {secondaryAction ? (
        <div className="flex flex-col border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className={`${buttonBaseClassName} ${buttonClassNames.outline} w-full font-semibold`}
          >
            <PlusIcon />
            {secondaryAction.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}
