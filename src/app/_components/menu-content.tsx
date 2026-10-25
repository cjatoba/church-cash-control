import type { ThemePreference } from "@/app/_lib/theme";
import { NavListItem, NavSection } from "./nav-list";
import { SectionTitle } from "./card";
import { LogoutButton } from "./logout-button";
import { ThemeSelector } from "./theme-selector";
import {
  ClockIcon,
  DevicePhoneIcon,
  LockIcon,
  PaintBrushIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
} from "./icons";

export function MenuContent({
  userName,
  canManageUsers,
  theme,
  changeTheme,
  logout,
}: {
  userName: string;
  canManageUsers: boolean;
  theme: ThemePreference;
  changeTheme: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
}) {
  const initial = userName.trim().charAt(0).toUpperCase();

  return (
    <>
      <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
          {initial}
        </span>
        <span className="text-lg font-semibold break-words">{userName}</span>
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
        <NavListItem
          href="/help"
          title="Ajuda"
          description="Como usar cada parte do app"
          icon={<QuestionMarkCircleIcon />}
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

      {canManageUsers ? (
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
    </>
  );
}
