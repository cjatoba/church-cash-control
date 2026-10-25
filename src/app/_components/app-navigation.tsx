import { cookies } from "next/headers";
import { auth, signOut } from "@/auth";
import { THEME_COOKIE_NAME, parseThemePreference, type ThemePreference } from "@/app/_lib/theme";
import { BottomNav } from "./bottom-nav";
import { MenuContent } from "./menu-content";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function AppNavigation({ theme }: { theme: ThemePreference }) {
  const session = await auth();
  if (!session) {
    return null;
  }

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
  }

  async function logout(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <BottomNav
      menu={
        <MenuContent
          userName={session.user.name}
          canManageUsers={session.user.canManageUsers}
          theme={theme}
          changeTheme={changeTheme}
          logout={logout}
        />
      }
    />
  );
}
