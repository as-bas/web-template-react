import "@/i18n";
import "@/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/app";
import { store } from "@/app/store";
import { authApi } from "@/features/auth/auth-api";

// Restore the session from the refresh cookie before the first guard runs.
// Outside React so StrictMode's double effects can't fire it twice.
store.dispatch(authApi.endpoints.refresh.initiate());

// biome-ignore lint/style/noNonNullAssertion: root element is in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
