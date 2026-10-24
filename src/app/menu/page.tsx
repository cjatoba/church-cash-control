import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader, roundIconButtonClassName } from "@/app/_components/page-header";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { SectionTitle } from "@/app/_components/card";
import { LogoutButton } from "@/app/_components/logout-button";
import {
  ClockIcon,
  DevicePhoneIcon,
  LockIcon,
  PaintBrushIcon,
  UsersIcon,
  XMarkIcon,
} from "@/app/_components/icons";
import { THEME_COOKIE_NAME, parseThemePreference } from "@/app/_lib/theme";
import { ThemeSelector } from "./theme-selector";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export default async function MenuPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const theme = parseThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);

  async function changeTheme(formData: FormData): Promise<void> {
    "use server";

    const value = formData.get("theme");
    const preference = parseThemePreference(typeof value === "string" ? value : undefined);
    const store = await cookies();
    store.set(THEME_COOKIE_NAME, preference, {
      maxAge: ONE_YEAR_IN_SECONDS,
      sameSite: "lax",
      path: "/",
    });
    redirect("/menu");
  }

  async function logout(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const initial = session.user.name.trim().charAt(0).toUpperCase();

  return (
    <PageShell>
      <PageHeader
        title="Menu"
        action={
          <Link href="/" aria-label="Fechar menu" className={roundIconButtonClassName}>
            <XMarkIcon />
          </Link>
        }
      />

      <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
          {initial}
        </span>
        <span className="text-lg font-semibold break-words">{session.user.name}</span>
      </section>

      <NavSection title="Minha conta">
        <NavListItem href="/account/password" title="Trocar senha" icon={<LockIcon />} />
        <NavListItem
          href="/install"
          title="Instalar no celular"
          description="Abrir como aplicativo, com ícone na tela"
          icon={<DevicePhoneIcon className="h-6 w-6" />}
          iconTone="blue"
        />
      </NavSection>

      <section className="flex flex-col gap-2">
        <SectionTitle>Aparência</SectionTitle>
        <ThemeSelector current={theme} action={changeTheme} />
        <p className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
          &quot;Automático&quot; segue o modo claro ou escuro do seu celular.
        </p>
      </section>

      {session.user.canManageUsers ? (
        <NavSection title="Administração">
          <NavListItem
            href="/users"
            title="Voluntários e acessos"
            description="Cadastrar e gerenciar quem usa o sistema"
            icon={<UsersIcon className="h-6 w-6" />}
          />
          <NavListItem
            href="/app-settings"
            title="Personalizar app"
            description="Nome e ícone que aparecem no celular"
            icon={<PaintBrushIcon />}
          />
          <NavListItem
            href="/activity-log"
            title="Registro de atividades"
            description="Quem fez o quê e quando"
            icon={<ClockIcon className="h-6 w-6" />}
          />
        </NavSection>
      ) : null}

      <LogoutButton action={logout} />
    </PageShell>
  );
}
