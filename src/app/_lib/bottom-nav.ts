export type BottomNavTab = "home" | "menu";

const HIDDEN_ROUTES = ["/login", "/change-password", "/tutorial"];

const MENU_ROUTES = [
  "/menu",
  "/account",
  "/install",
  "/help",
  "/users",
  "/app-settings",
  "/activity-log",
];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function selectBottomNavTab(pathname: string): BottomNavTab | null {
  if (HIDDEN_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return null;
  }
  if (MENU_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return "menu";
  }
  return "home";
}
