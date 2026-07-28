/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** CDN origin for production kanji SVGs / vocab (no trailing slash). */
  readonly VITE_ENV_ASSET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
