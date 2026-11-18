// Build-time config (Vite inlines import.meta.env at build). Static output:
// changing these needs a rebuild. Everything here ends up in the public
// bundle: never put a secret in a VITE_ variable.
export const env = {
  // Empty: same origin as the page (dev proxy, or the caddy proxy in prod).
  apiUrl: (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, ""),
} as const;
