import Link from "next/link";

export function TemporaryPasswordReveal({
  title,
  message,
  temporaryPassword,
  whatsappLink,
  backHref,
  backLabel = "← Voltar para usuários",
  secondaryAction,
}: {
  title: string;
  message: string;
  temporaryPassword: string;
  whatsappLink?: string;
  backHref: string;
  backLabel?: string;
  secondaryAction?: { href: string; label: string };
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{title}</h1>
      <p className="rounded bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
        {message}
      </p>

      <div className="flex flex-col gap-1 rounded border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <span className="text-xs font-medium tracking-wide text-amber-700 uppercase dark:text-amber-400">
          Senha temporária — anote agora
        </span>
        <span className="font-mono text-base text-black dark:text-zinc-50">
          {temporaryPassword}
        </span>
        <span className="text-xs text-amber-700 dark:text-amber-400">
          Ela só aparece aqui uma vez. A pessoa será obrigada a trocar no primeiro acesso.
        </span>
      </div>

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1ebe57]"
        >
          Abrir WhatsApp com o convite
        </a>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum celular cadastrado — repasse a senha pelo canal de sua preferência.
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="text-sm text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
        <Link
          href={backHref}
          className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
