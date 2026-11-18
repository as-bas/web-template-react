import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEMES, themeMeta } from "@/config/themes";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Select value={themeMeta(theme).value} onValueChange={setTheme}>
      <SelectTrigger size="sm" aria-label={t("Theme")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <option.icon />
            {option.label(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
