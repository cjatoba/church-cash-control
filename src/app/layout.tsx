import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE_NAME, parseThemePreference } from "@/app/_lib/theme";
import { InstallPromptCapture } from "@/app/_components/install-prompt-capture";
import { getCachedAppBranding } from "@/app/_lib/app-branding";
import { appIconUrl } from "@/app/_lib/app-icon-catalog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCachedAppBranding();

  return {
    title: branding.name,
    description: "Controle de caixa para igrejas — campanhas, carnês e arrecadação.",
    icons: {
      icon: appIconUrl("icon-192.png", branding),
      apple: appIconUrl("apple-icon.png", branding),
    },
    appleWebApp: {
      title: branding.shortName,
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = parseThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html
      lang="pt-BR"
      data-theme={theme === "system" ? undefined : theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <InstallPromptCapture />
        {children}
      </body>
    </html>
  );
}
