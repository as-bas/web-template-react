import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { authSlice } from "@/features/auth/auth-slice";
import { api } from "@/services/api";

const rootReducer = combineSlices(authSlice, api);

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

export const store = makeStore();

// Refetch on focus / reconnect, and pause polling while the tab is hidden.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
