import i18n from "@/i18n";
import type { ApiFailure } from "@/types/api";

const isApiFailure = (data: unknown): data is ApiFailure =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as ApiFailure).message === "string";

// User-facing message for an RTK Query error (hook `error` or a rejected
// `.unwrap()`). API messages arrive already translated (X-Lang), so they are
// shown as-is.
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const { status, data } = error as { status: unknown; data?: unknown };
    if (isApiFailure(data)) return data.message;
    if (status === "FETCH_ERROR") {
      return i18n.t("Unable to reach the server");
    }
  }
  return i18n.t("Something went wrong");
};

// The API's error `code` (e.g. "COMPANY_NAME_TAKEN"), if any.
export const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const { data } = error as { data?: unknown };
    if (isApiFailure(data)) return data.code;
  }
  return undefined;
};

// Per-field messages of a 422 (`errors[].path` -> message), first one wins.
export const getFieldErrors = (error: unknown): Record<string, string> => {
  const fields: Record<string, string> = {};
  if (typeof error === "object" && error !== null && "data" in error) {
    const { data } = error as { data?: unknown };
    if (isApiFailure(data)) {
      for (const { path, message } of data.errors ?? []) {
        if (path && !(path in fields)) fields[path] = message;
      }
    }
  }
  return fields;
};
