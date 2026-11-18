import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session, UserProfile } from "@/features/auth/types";

// "restoring": boot-time refresh in flight, we don't know yet.
export type AuthStatus = "restoring" | "authenticated" | "guest";

type AuthState = {
  status: AuthStatus;
  // Memory only. The refresh token lives in an httpOnly cookie set by the API.
  accessToken: string | null;
  user: UserProfile | null;
};

const initialState: AuthState = {
  status: "restoring",
  accessToken: null,
  user: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionReceived(state, action: PayloadAction<Session>) {
      state.status = "authenticated";
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    sessionCleared(state) {
      state.status = "guest";
      state.accessToken = null;
      state.user = null;
    },
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectAccessToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.user,
  },
});

export const { sessionReceived, sessionCleared } = authSlice.actions;
export const { selectAuthStatus, selectAccessToken, selectCurrentUser } =
  authSlice.selectors;
