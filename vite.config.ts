import path from "path";
import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { TemplateType } from "rollup-plugin-visualizer/dist/plugin/template-types";

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
      "Efficiently identify and study the most relevant kanji using frequency data-driven visuals. Explore kanji with advanced filtering, sorting, and more.",
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
    runtimeCaching: [
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
        the JSON files won’t be available until they go online. 
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
export default defineConfig({
  plugins: [
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
  build: {
    target: "esnext", // Needed for module workers
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
