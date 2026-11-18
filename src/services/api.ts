import {
  type BaseQueryApi,
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import { env } from "@/config/env";
import { sessionCleared, sessionReceived } from "@/features/auth/auth-slice";
import type { Session } from "@/features/auth/types";
import i18n from "@/i18n";
import type { ApiSuccess } from "@/types/api";

const REFRESH_URL = "/v1/auth/refresh";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  // Sends the httpOnly refresh cookie (scoped by the API to /v1/auth).
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // The API translates its error messages from this.
    headers.set("X-Lang", i18n.resolvedLanguage ?? i18n.language);
    return headers;
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const doRefresh = async (
  api: BaseQueryApi,
  extraOptions: object,
): Promise<boolean> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await rawBaseQuery(
      { url: REFRESH_URL, method: "POST" },
      api,
      extraOptions,
    );
    if (result.data) {
      api.dispatch(sessionReceived((result.data as ApiSuccess<Session>).data));
      return true;
    }
    // 409 REFRESH_TOKEN_ROTATED: another tab rotated first and the browser
    // already holds its new cookie, so retrying shortly succeeds.
    if (result.error?.status !== 409) break;
    await sleep(300 * (attempt + 1));
  }
  api.dispatch(sessionCleared());
  return false;
};

// One refresh at a time: concurrent 401s share the same request, since a
// second rotation with the old cookie would be rejected.
let refreshing: Promise<boolean> | null = null;

export const refreshSession = (api: BaseQueryApi, extraOptions: object) => {
  refreshing ??= doRefresh(api, extraOptions).finally(() => {
    refreshing = null;
  });
  return refreshing;
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  if (refreshing) await refreshing;

  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;

  // Access token expired: refresh once, then replay the request.
  if (result.error?.status === 401 && !url.startsWith("/v1/auth/")) {
    if (await refreshSession(api, extraOptions)) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }
  return result;
};

// Feature endpoints are added with `api.injectEndpoints` in their own files.
// Add a tag type here when a feature's cache needs invalidation.
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me"],
  endpoints: () => ({}),
});
