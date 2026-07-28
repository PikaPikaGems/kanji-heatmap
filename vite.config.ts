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

// The engine itself is bundled rather than copied, so Rollup has to resolve it.
const KANJI_CANVAS_ID = "kanjicanvas/docs/resources/javascript/kanji-canvas.js";
const KANJI_CANVAS_SRC = path.resolve(
  __dirname,
  "node_modules",
  KANJI_CANVAS_ID
);
const KANJI_CANVAS_STUB = "\0kanjicanvas-not-installed";
const kanjiCanvasInstalled = () => fs.existsSync(KANJI_CANVAS_SRC);

// kanjicanvas is an optional dependency: it has no npm release, so it installs
// from a GitHub tarball, which some sandboxed environments cannot reach. Its
// absence must not break `pnpm install`, `pnpm test` or a dev server — only the
// on-device handwriting backend, which the UI already treats as one of several
// choices. A deployable build is a different matter: shipping without it would
// silently drop the feature, so CI fails loudly instead.
const copyRefPatterns = (): void => {
  if (!fs.existsSync(REF_PATTERNS_SRC)) {
    const message =
      "kanjicanvas is not installed, so public/js/ref-patterns.js cannot be " +
      "written. The kanjicanvas handwriting backend will be unavailable.";
    if (process.env.CI) {
      throw new Error(
        `${message} Refusing to produce a deployable build without it.`
      );
    }
    console.warn(`\n[kanjicanvas-ref-patterns] ${message}\n`);
    return;
  }

  if (!fs.existsSync(REF_PATTERNS_DEST_DIR))
    fs.mkdirSync(REF_PATTERNS_DEST_DIR, { recursive: true });
  fs.copyFileSync(REF_PATTERNS_SRC, REF_PATTERNS_DEST);
};

const kanjiCanvasRefPatternsPlugin: Plugin = {
  name: "kanjicanvas-ref-patterns",
  // `pre`, so resolveId sees the bare specifier. Vite's own resolver would
  // otherwise turn it into an absolute path first and then fail to read it.
  enforce: "pre",
  configureServer: copyRefPatterns,
  buildStart: copyRefPatterns,

  // With the package absent, stub the bundled import so the build still
  // completes. The stub throws when the module is evaluated, which is on the
  // dynamic import inside kanjicanvas-adapter — a path that already resets its
  // memo and rethrows, so the handwriting UI falls back exactly as it does for
  // any other engine load failure.
  resolveId(id) {
    // Matches the bare specifier and the absolute path, since dependency
    // pre-bundling may have resolved it before this hook runs.
    const isKanjiCanvas =
      id === KANJI_CANVAS_ID ||
      id.replace(/\\/g, "/").endsWith(KANJI_CANVAS_ID);
    return isKanjiCanvas && !kanjiCanvasInstalled() ? KANJI_CANVAS_STUB : null;
  },
  load(id) {
    return id === KANJI_CANVAS_STUB
      ? 'throw new Error("kanjicanvas is not installed in this build");'
      : null;
  },
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
      // ORT wasm emitted by Vite as a hashed /assets/*.wasm chunk
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
        urlPattern: /\/(assets|font)\/.*\.(woff2|woff)$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanji-heatmap-fonts",
          expiration: { maxEntries: 40, maxAgeSeconds: 365 * 24 * 60 * 60 },
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
      /*
      Two rules, not one, because these are different populations sharing one
      LRU otherwise: 11 core data files against 200 speed-katakana challenge
      sets. A single cache capped at 50 entries meant playing a few rounds of
      speed katakana could evict kanji_main.json — the file the whole app waits
      on at startup — and a first-time offline visit would then have nothing.
      Separate caches cannot evict each other.
      */
      {
        // Core kanji data. 11 files today, all of which a heavy session touches,
        // so the cap only needs headroom for the layout changing.
        urlPattern: /\/json\/(?!katakana\/).*\.json$/i,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "kanji-heatmap-json-cache",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        // Speed-katakana challenge sets: 200 small files, and a player only ever
        // revisits a handful, so this is the one that should be evicting.
        urlPattern: /\/json\/katakana\/.*\.json$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "kanji-heatmap-katakana-cache",
          expiration: {
            maxEntries: 230,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 week
          },
        },
      },
      // **********************
      // DOCS MARKDOWN from public folder (same caching trade-off as JSON)
      // **********************
      {
        urlPattern: /\/md\/.*\.md$/i,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "kanji-heatmap-md-cache",
          expiration: {
            maxEntries: 10,
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
      // Cache KANJI SVG — committed local files (public/svg/, the
      // ~2426 filtered_kanji.json set) plus the CDN fallback for everything
      // else (e.g. 唸), sharing one cache so clearKanjiSvgCache() covers both.
      // **********************
      {
        urlPattern: ({ url }: { url: { pathname: string; origin: string } }) =>
          url.pathname.endsWith(".svg") &&
          ((url.origin === "https://assets.pikapikagems.com" &&
            url.pathname.startsWith("/kanji/")) ||
            url.pathname.startsWith("/svg/")),
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
    assetsInlineLimit: 0, // keep the ~13MB ORT wasm as a separate file
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
