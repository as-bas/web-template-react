import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FullPageLoader() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2Icon
        className="size-6 animate-spin text-muted-foreground"
        aria-label={t("Loading")}
      />
    </div>
  );
}
