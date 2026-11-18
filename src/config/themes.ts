import type { TFunction } from "i18next";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type Theme = "light" | "dark" | "system";

// Used until the viewer picks one; next-themes keeps the choice in
// localStorage, so it applies to every tab of this browser.
export const DEFAULT_THEME: Theme = "light";

export type ThemeMeta = {
  value: Theme;
  label: (t: TFunction) => string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const THEMES: ThemeMeta[] = [
  { value: "light", label: (t) => t("Light"), icon: SunIcon },
  { value: "dark", label: (t) => t("Dark"), icon: MoonIcon },
  { value: "system", label: (t) => t("System"), icon: MonitorIcon },
];

export function themeMeta(theme: string | undefined): ThemeMeta {
  return (
    THEMES.find((option) => option.value === theme) ??
    // biome-ignore lint/style/noNonNullAssertion: DEFAULT_THEME is in THEMES
    THEMES.find((option) => option.value === DEFAULT_THEME)!
  );
}
