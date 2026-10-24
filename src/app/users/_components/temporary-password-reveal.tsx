import { BackLink } from "@/app/_components/back-link";

export function TemporaryPasswordReveal({
  title,
  message,
  temporaryPassword,
  whatsappLink,
  backHref,
  secondaryAction,
}: {
  title: string;
  message: string;
  temporaryPassword: string;
  whatsappLink: string;
  backHref: string;
  secondaryAction?: { onClick: () => void; label: string };
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
      <p className="rounded-xl bg-green-50 p-3 text-[15px] text-green-800 dark:bg-green-950/50 dark:text-green-300">
        {message}
      </p>

      <div className="flex flex-col gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="text-sm font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
          Senha temporária — anote agora
        </span>
        <span className="font-mono text-base text-black dark:text-zinc-50">
          {temporaryPassword}
        </span>
        <span className="text-[15px] text-amber-800 dark:text-amber-300">
          Ela só aparece aqui uma vez. A pessoa será obrigada a trocar no primeiro acesso.
        </span>
      </div>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-base font-semibold text-zinc-950 transition-colors hover:bg-[#1ebe57]"
      >
        Abrir WhatsApp com o convite
      </a>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="min-h-11 text-left text-[15px] text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            {secondaryAction.label}
          </button>
        ) : null}
        <BackLink href={backHref} />
      </div>
    </div>
  );
}
