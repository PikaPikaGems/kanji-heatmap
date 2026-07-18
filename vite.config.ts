import fs from "fs";
import path from "path";
import { defineConfig, UserConfig, Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { TemplateType } from "rollup-plugin-visualizer/dist/plugin/template-types";

// Copies ref-patterns.js out of node_modules into public/js/ so Rollup never
// bundles it (removing the 6.4 MB chunk warning). It's still lazy-loaded at
// runtime via a <script> tag and cached by the service worker.
const REF_PATTERNS_SRC = path.resolve(
  __dirname,
  "node_modules/kanjicanvas/docs/resources/javascript/ref-patterns.js"
);
const REF_PATTERNS_DEST_DIR = path.resolve(__dirname, "public/js");
const REF_PATTERNS_DEST = path.join(REF_PATTERNS_DEST_DIR, "ref-patterns.js");

const copyRefPatterns = (): void => {
  if (!fs.existsSync(REF_PATTERNS_DEST_DIR))
    fs.mkdirSync(REF_PATTERNS_DEST_DIR, { recursive: true });
  fs.copyFileSync(REF_PATTERNS_SRC, REF_PATTERNS_DEST);
};

const kanjiCanvasRefPatternsPlugin: Plugin = {
  name: "kanjicanvas-ref-patterns",
  configureServer: copyRefPatterns,
  buildStart: copyRefPatterns,
};

// onnxruntime-web@1.17.3 does not export individual .wasm paths, so copy the
// low-memory ort-wasm.wasm next to the DaKanji model under public/onnx/.
const ORT_WASM_SRC = path.resolve(
  __dirname,
  "node_modules/onnxruntime-web/dist/ort-wasm.wasm"
);
const ORT_WASM_DEST_DIR = path.resolve(__dirname, "public/onnx");
const ORT_WASM_DEST = path.join(ORT_WASM_DEST_DIR, "ort-wasm.wasm");

const copyOrtWasm = (): void => {
  if (!fs.existsSync(ORT_WASM_SRC)) {
    throw new Error(`Missing ORT wasm at ${ORT_WASM_SRC}`);
  }
  if (!fs.existsSync(ORT_WASM_DEST_DIR)) {
    fs.mkdirSync(ORT_WASM_DEST_DIR, { recursive: true });
  }
  fs.copyFileSync(ORT_WASM_SRC, ORT_WASM_DEST);
};

const ortWasmPlugin: Plugin = {
  name: "ort-wasm-copy",
  configureServer: copyOrtWasm,
  buildStart: copyOrtWasm,
};

const pwaConfig = {
  // registerType: 'prompt' <-- if we want to ensure user updates
  registerType: "autoUpdate" as const,
  includeAssets: [
    "favicon.io",
    "img/icon512_maskable",
    "img/icon512_rounded.png",
  ],
  manifest: {
    name: "Kanji Heatmap",
    short_name: "KanjiHeatmap",
    orientation: "any" as const,
    display: "standalone" as const,
    lang: "en-US" as const,
    description:
      "Efficiently identify and study the kanji most useful to you with frequency data visuals, advanced filtering, sorting, and more",
    start_url: ".",
    theme_color: "#fb02a8",
    background_color: "#FFFFFF",
    icons: [
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "img/app-icon-512x512.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "192x192",
        src: "img/app-icon-192x192.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "img/app-icon-512x512.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "192x192",
        src: "img/app-icon-192x192.png",
        type: "image/png",
      },
    ],
  },

  workbox: {
    globPatterns: ["**/*.{js,css,html}"],
    // The kanjicanvas reference patterns are a ~6.4MB lazy chunk only needed for
    // "Handwriting Alt". Too big to precache (and wasteful to ship to everyone),
    // so exclude it from precache and cache it at runtime on first use instead.
    // Same for DaKanji onnx assets (~2MB) used by "Handwriting Alt 2".
    globIgnores: ["**/ref-patterns.js", "**/onnx/**"],
    runtimeCaching: [
      // **********************
      // KANJICANVAS reference patterns (lazy, on-device handwriting recognition)
      // **********************
      {
        urlPattern: /\/js\/ref-patterns\.js$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanjicanvas-patterns-cache",
          expiration: {
            maxEntries: 2,
            maxAgeSeconds: 365 * 24 * 60 * 60, // One year
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // **********************
      // DAKANJI ONNX model + labels (lazy, Handwriting Alt 2)
      // **********************
      {
        urlPattern: /\/onnx\/.*/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "dakanji-onnx-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // One year
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // **********************
      // Any remaining hashed /assets/*.wasm chunks (ORT wasm itself lives under
      // /onnx/ort-wasm.wasm and is covered by the dakanji-onnx-cache rule above)
      // **********************
      {
        urlPattern: /\/assets\/.*\.wasm$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "dakanji-ort-wasm-cache",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // One year
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // **********************
      // JISHO API (proxied via Cloudflare Pages Function)
      // **********************
      {
        urlPattern: /\/api\/jisho(\?.*)?$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "jisho-api-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      // **********************
      // JOTOBA API (proxied via Cloudflare Pages Function)
      // **********************
      {
        urlPattern: /\/api\/jotoba(\?.*)?$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "jotoba-api-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      // **********************
      // FONTS
      // **********************
      {
        urlPattern: /assets\/.*\.(woff2|woff)$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanji-heatmap-fonts",
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // **********************
      // KANJI DATA JSON FILES from public folder
      // **********************
      /*

      precached files take precedence over runtime rules,
      but since these json files have static file names
      workbox won't know if it has actually been updated
      So we don't put these json files in globPatterns/pre-cache

      Trade-off:
        If a user visits the app offline for the first time,
        the JSON files won't be available until they go online.
        After the initial fetch, offline access is supported.
      */
      {
        urlPattern: /\/json\/.*\.json$/i,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "kanji-heatmap-json-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      // **********************
      // Cache KANJI SAMPLE VOCABULARY from external source
      // **********************
      {
        urlPattern: ({ url }: { url: { pathname: string; origin: string } }) =>
          url.origin === "https://assets.pikapikagems.com" &&
          url.pathname.startsWith("/kanji-common-words/v1/"),
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanji-vocabulary-cache",
          expiration: {
            maxEntries: 3000,
            maxAgeSeconds: 365 * 24 * 60 * 60, // One year
          },
          fetchOptions: {
            mode: "cors" as const,
            credentials: "omit" as const,
          },
        },
      },

      // **********************
      // Cache KANJI SVG from external source
      // **********************
      {
        urlPattern: ({ url }: { url: { pathname: string; origin: string } }) =>
          url.origin === "https://assets.pikapikagems.com" &&
          url.pathname.startsWith("/kanji/") &&
          url.pathname.endsWith(".svg"),
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanji-svg-cache",
          expiration: {
            maxEntries: 3000,
            maxAgeSeconds: 365 * 24 * 60 * 60, // One year
          },
          fetchOptions: {
            mode: "cors" as const, // Enable cross-origin requests
            credentials: "omit" as const, // No credentials for cross-origin
          },
        },
      },
    ],
  },
};

const visualizer_templates: TemplateType[] = [
  "sunburst",
  "treemap",
  "network",
  "list",
  "flamegraph",
] as const;
// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    kanjiCanvasRefPatternsPlugin,
    ortWasmPlugin,
    process.env.CF_PAGES ? null : cloudflare(),
    react(),
    VitePWA(pwaConfig),
    process.env.ANALYZE
      ? visualizer({
          filename: "stats.html",
          open: true,
          template: visualizer_templates.includes(
            process.env.ANALYZE_TEMPLATE as TemplateType
          )
            ? (process.env.ANALYZE_TEMPLATE as TemplateType)
            : "sunburst", //  sunburst, treemap, network, raw-data, list, flamegraph
          // sourcemap: true
          // gzipSize: true,
        })
      : null,
  ] as UserConfig["plugins"],
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(String(Date.now())),
  },
  build: {
    target: "esnext", // Needed for module workers
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Keep the app entry lean by isolating large, cache-friendly vendor groups.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("/.pnpm/react@") ||
            id.includes("/.pnpm/react-dom@") ||
            id.includes("/.pnpm/scheduler@") ||
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "react-vendor";
          }

          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }

          if (id.includes("lucide-react")) {
            return "lucide";
          }

          if (id.includes("/vaul")) {
            return "vaul";
          }

          if (id.includes("wanakana")) {
            return "wanakana";
          }

          if (id.includes("/cmdk")) {
            return "cmdk";
          }
        },
      },
    },
  },
  assetsInclude: ["**/*.wasm"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // kanjicanvas is installed straight from GitHub and ships no package.json,
      // so bare deep imports won't resolve during the production (Rollup) build.
      // Point the specifier at the installed package dir explicitly.
      kanjicanvas: path.resolve(__dirname, "./node_modules/kanjicanvas"),
    },
  },
}));
