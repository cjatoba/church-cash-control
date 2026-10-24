import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { AppIconTile } from "@/app/_components/app-icon-tile";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { appIconColorOptions, appIconGlyph } from "@/app/_lib/app-icon-catalog";

// "rounded: false" e margem maior nos ícones que o próprio sistema recorta
// (maskable do Android e apple-touch-icon do iPhone), para nada sumir no corte.
const iconVariants: Record<string, { size: number; rounded: boolean; glyphScale: number }> = {
  "icon-192.png": { size: 192, rounded: true, glyphScale: 0.6 },
  "icon-512.png": { size: 512, rounded: true, glyphScale: 0.6 },
  "icon-maskable-512.png": { size: 512, rounded: false, glyphScale: 0.48 },
  "apple-icon.png": { size: 180, rounded: false, glyphScale: 0.54 },
};

// A fonte padrão do ImageResponse não tem negrito: "R$" e a inicial saíam finos
// demais perto dos ícones de traço. Geist Bold (licença OFL, ver assets/fonts).
const geistBold = await readFile(join(process.cwd(), "assets/fonts/Geist-Bold.ttf"));

export async function GET(_request: Request, { params }: RouteContext<"/icons/[file]">) {
  const { file } = await params;
  const variant = iconVariants[file];
  if (!variant) {
    return new Response("Not found", { status: 404 });
  }

  const branding = await getCachedAppBranding();

  return new ImageResponse(
    <AppIconTile
      glyph={appIconGlyph(branding.icon, branding.name)}
      background={appIconColorOptions[branding.color].hex}
      size={variant.size}
      rounded={variant.rounded}
      glyphScale={variant.glyphScale}
    />,
    {
      width: variant.size,
      height: variant.size,
      fonts: [{ name: "Geist", data: geistBold, weight: 700, style: "normal" }],
    },
  );
}
