import { sessionCleared, sessionReceived } from "@/features/auth/auth-slice";
import type {
  ChangePasswordRequest,
  LoginRequest,
  Me,
  Session,
} from "@/features/auth/types";
import { api, refreshSession } from "@/services/api";
import type { ApiSuccess } from "@/types/api";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, LoginRequest>({
      query: (body) => ({ url: "/v1/auth/login", method: "POST", body }),
      transformResponse: (response: ApiSuccess<Session>) => response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionReceived(data));
        } catch {
          // surfaced through the mutation's `error`
        }
      },
    }),
    // Restores the session from the refresh cookie (app boot).
    refresh: build.mutation<boolean, void>({
      queryFn: async (_arg, baseApi, extraOptions) => ({
        data: await refreshSession(baseApi, extraOptions ?? {}),
      }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/v1/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Log out locally even if the API call failed.
          dispatch(sessionCleared());
          dispatch(api.util.resetApiState());
        }
      },
    }),
    // 204. Other sessions are signed out; this one keeps its refresh cookie.
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/v1/auth/password", method: "POST", body }),
    }),
    me: build.query<Me, void>({
      query: () => "/v1/me",
      transformResponse: (response: ApiSuccess<Me>) => response.data,
      providesTags: ["Me"],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} = authApi;
