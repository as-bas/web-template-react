/// <reference types="vitest/config" />
import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Same API_UPSTREAM in every mode. `host.containers.internal` is the host
  // as seen from a container; running on the host itself, that's localhost.
  const inContainer =
    existsSync("/run/.containerenv") || existsSync("/.dockerenv");
  const upstream = env.API_UPSTREAM || "http://host.containers.internal:3000";
  const apiTarget = inContainer
    ? upstream
    : upstream.replace("host.containers.internal", "localhost");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      // Production bundles carry no source maps (they would undo minifying
      // and obfuscation).
      sourcemap: false,
      rolldownOptions: {
        output: {
          // Libraries in their own chunk: cached across app releases, and
          // left alone by scripts/obfuscate.ts (obfuscating them breaks
          // them, and they are public code anyway).
          codeSplitting: {
            groups: [{ name: "vendor", test: /node_modules/ }],
          },
        },
      },
    },
    server: {
      host: env.VITE_HOST ?? "localhost",
      port: Number(env.PORT ?? 5173),
      strictPort: true,
      // Bind mounts from the podman VM don't always deliver fs events.
      watch: env.VITE_USE_POLLING === "true" ? { usePolling: true } : undefined,
      // Dev only: forward API calls so the refresh cookie stays same-origin
      // (no credentialed CORS needed against the API).
      proxy: {
        "/v1": {
          target: apiTarget,
          changeOrigin: true,
          // A remote API may scope its cookie to its own domain; keep it on
          // the dev origin instead.
          cookieDomainRewrite: "",
        },
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      // Node's fetch/Request need absolute URLs (a browser resolves "/v1/..."
      // against the page). Tests stub fetch, so the host never resolves.
      env: { VITE_API_URL: "http://api.test" },
    },
  };
});
