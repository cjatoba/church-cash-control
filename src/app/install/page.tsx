import { headers } from "next/headers";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { InfoIcon } from "@/app/_components/icons";
import { detectMobilePlatform } from "@/app/_lib/mobile-platform";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { appIconColorOptions, appIconGlyph } from "@/app/_lib/app-icon-catalog";
import { AppIconTile } from "@/app/_components/app-icon-tile";
import { InstallGuide } from "./install-guide";

export default async function InstallPage() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const platform = detectMobilePlatform(userAgent);
  const branding = await getCachedAppBranding();

  return (
    <PageShell>
      <PageHeader backHref="/" backLabel="Voltar para o início" title="Instalar no celular" />

      <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <AppIconTile
          glyph={appIconGlyph(branding.icon, branding.name)}
          background={appIconColorOptions[branding.color].hex}
          size={60}
        />
        <p className="text-base text-zinc-700 dark:text-zinc-300">
          Coloque o <strong>{branding.name}</strong> na tela inicial do celular e abra como um
          aplicativo, em tela cheia.
        </p>
      </section>

      <InstallGuide initialTab={platform === "ios" ? "iphone" : "android"} />

      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <InfoIcon className="h-6 w-6 shrink-0 text-zinc-500" />
        <p className="text-[15px] text-zinc-700 dark:text-zinc-300">
          Depois de instalado, abra pelo ícone <strong>{branding.shortName}</strong> na tela do
          celular. O app continua precisando de internet.
        </p>
      </div>
    </PageShell>
  );
}
