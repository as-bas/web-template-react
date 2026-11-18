import type { TFunction } from "i18next";
import { HomeIcon, KeyRoundIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Sidebar menu. Labels take `t` so they follow the language and stay
// literal for `pnpm i18n:sync`.
export const getSidebarNav = (t: TFunction): NavItem[] => [
  { title: t("Home"), url: "/", icon: HomeIcon },
  { title: t("Change password"), url: "/change-password", icon: KeyRoundIcon },
];
