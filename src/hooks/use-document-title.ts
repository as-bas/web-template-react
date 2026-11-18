import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMatches } from "react-router";
import { APP_NAME } from "@/config/app";
import type { RouteHandle } from "@/types/router";

// `<page title> · <app name>` from the deepest route's `handle`, in the
// current language. Client-side only: crawlers that don't run JS still see
// index.html's <title> (see frontend-blueprint.md "SEO").
export function useDocumentTitle() {
  const { t } = useTranslation();
  const handle = useMatches().at(-1)?.handle as RouteHandle | undefined;
  const title = handle?.title?.(t);

  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
