import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// Standalone config: intentionally does NOT import vite.config.ts, so the
// Cloudflare, PWA, and ref-patterns plugins never load during unit tests.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify("test"),
    __STUDY_ENGINE_INCLUDED__: JSON.stringify(false),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Tests never load the optional study engine (see vite.config.ts).
      "kh-study-engine/mock": path.resolve(
        __dirname,
        "./src/lib/engine/not-included.ts"
      ),
      "kh-study-engine": path.resolve(
        __dirname,
        "./src/lib/engine/not-included.ts"
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
  },
});
