/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** CDN origin for production kanji SVGs / vocab (no trailing slash). */
  readonly VITE_ENV_ASSET_URL?: string;
  /**
   * Study engine backend (e.g. "https://example.com/api"). Unset: the engine,
   * when included, runs against its in-memory mock backend.
   */
  readonly VITE_ENGINE_API_BASE_URL?: string;
}

/** True when the build includes the optional study engine (vite.config.ts). */
declare const __STUDY_ENGINE_INCLUDED__: boolean;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
