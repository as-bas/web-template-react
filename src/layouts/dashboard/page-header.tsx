import { useTranslation } from "react-i18next";
import { useMatches } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { RouteHandle } from "@/types/router";

// Title + description from the deepest route's `handle`.
export function PageHeader() {
  const { t } = useTranslation();
  const handle = useMatches().at(-1)?.handle as RouteHandle | undefined;
  const title = handle?.title?.(t);
  const description = handle?.description?.(t);

  return (
    <header className="flex min-h-16 shrink-0 items-center gap-3 border-b px-6 py-3">
      <SidebarTrigger className="-ml-2" />
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-2xl font-semibold">{title}</h1>}
        {description && (
          <p className="truncate text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
