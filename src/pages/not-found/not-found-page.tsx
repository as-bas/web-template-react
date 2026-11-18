import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

// Rendered inside the dashboard layout, so the sidebar stays usable.
export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold">404</p>
      <p className="text-muted-foreground">{t("This page doesn't exist.")}</p>
      <Button asChild variant="outline">
        <Link to="/">{t("Back to home")}</Link>
      </Button>
    </div>
  );
}
