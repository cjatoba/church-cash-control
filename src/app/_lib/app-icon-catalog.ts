import type { AppBranding, AppIcon, AppIconColor } from "@/server/domain/app-branding";

export type AppIconGlyph = { kind: "path"; d: string } | { kind: "text"; text: string };

export const appIconLabels: Record<AppIcon, string> = {
  dollar: "Cifrão",
  church: "Igreja",
  cross: "Cruz",
  bible: "Bíblia",
  dove: "Pomba",
  fish: "Peixe",
  heart: "Coração",
  flame: "Chama",
  crown: "Coroa",
  star: "Estrela",
  safe: "Cofre",
  initial: "Inicial",
};

const iconPaths: Record<Exclude<AppIcon, "dollar" | "initial">, string> = {
  church: "M12 2v4M10 4h4M5 21V11l7-5 7 5v10M3 21h18M10 21v-5h4v5",
  cross: "M12 3v18M6 8h12",
  bible: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14",
  dove: "M3 13c3 0 5-2 7-6 1 3 3 5 6 5l5-2-2 4c-2 4-6 6-10 6H5l3-3c-3 0-5-2-5-4z",
  fish: "M2 12c4-6 12-6 16 0-4 6-12 6-16 0zM18 12l4-4v8z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  flame: "M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-9z",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
  safe: "M4 5h16v13H4zM12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M7 18v2M17 18v2",
};

export function appIconGlyph(icon: AppIcon, appName: string): AppIconGlyph {
  if (icon === "dollar") {
    return { kind: "text", text: "R$" };
  }
  if (icon === "initial") {
    return { kind: "text", text: appName.trim().charAt(0).toUpperCase() };
  }
  return { kind: "path", d: iconPaths[icon] };
}

export const appIconColorOptions: Record<AppIconColor, { label: string; hex: string }> = {
  green: { label: "Verde", hex: "#15803d" },
  blue: { label: "Azul", hex: "#1d4ed8" },
  navy: { label: "Marinho", hex: "#1e3a8a" },
  purple: { label: "Roxo", hex: "#6d28d9" },
  wine: { label: "Vinho", hex: "#9f1239" },
  orange: { label: "Laranja", hex: "#c2410c" },
  gold: { label: "Dourado", hex: "#a16207" },
  graphite: { label: "Grafite", hex: "#27272a" },
};

// O ImageResponse responde com cache imutável; a versão na URL muda sempre que
// nome, ícone ou cor mudam, forçando navegador e celular a buscar o ícone novo.
export function appIconVersion(branding: AppBranding): string {
  const source = `${branding.name}|${branding.icon}|${branding.color}`;
  let hash = 5381;
  for (const character of source) {
    hash = ((hash * 33) ^ character.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
}

export function appIconUrl(file: string, branding: AppBranding): string {
  return `/icons/${file}?v=${appIconVersion(branding)}`;
}
