import type { TFunction } from "i18next";

// Route `handle` contract, read by layouts via useMatches(). Functions of
// `t` so they follow the active language.
export type RouteHandle = {
  // Page header title, also the document title.
  title?: (t: TFunction) => string;
  // Muted line under the title.
  description?: (t: TFunction) => string;
};
