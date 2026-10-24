import type { AppIconGlyph } from "@/app/_lib/app-icon-catalog";

// Só estilos inline: o mesmo componente desenha a prévia na tela e os PNGs
// gerados pelo ImageResponse (Satori), que não entende classes CSS.
export function AppIconTile({
  glyph,
  background,
  size,
  rounded = true,
  glyphScale = 0.6,
}: {
  glyph: AppIconGlyph;
  background: string;
  size: number;
  rounded?: boolean;
  glyphScale?: number;
}) {
  const glyphSize = Math.round(size * glyphScale);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? Math.round(size * 0.22) : 0,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {glyph.kind === "text" ? (
        <span
          style={{
            color: "#ffffff",
            fontSize: Math.round(glyphSize * (glyph.text.length > 1 ? 0.62 : 0.8)),
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {glyph.text}
        </span>
      ) : (
        <svg
          width={glyphSize}
          height={glyphSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={glyph.d} />
        </svg>
      )}
    </div>
  );
}
