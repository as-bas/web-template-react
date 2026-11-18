/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the API. Empty = same origin (dev proxy / reverse proxy).
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
