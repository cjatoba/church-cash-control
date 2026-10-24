import type { MetadataRoute } from "next";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { appIconUrl } from "@/app/_lib/app-icon-catalog";

// O nome e o ícone vêm do banco: sem isto o Next tentaria gerar o manifesto
// no build, onde não há banco disponível (ex.: CI).
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getCachedAppBranding();

  return {
    name: branding.name,
    short_name: branding.shortName,
    description: "Controle de caixa para igrejas — campanhas, carnês e arrecadação.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#f4f4f5",
    icons: [
      {
        src: appIconUrl("icon-192.png", branding),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: appIconUrl("icon-512.png", branding),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: appIconUrl("icon-maskable-512.png", branding),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
