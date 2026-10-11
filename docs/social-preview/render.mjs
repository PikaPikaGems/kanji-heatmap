// Renders each design to a 1200x630 PNG. Usage: node render.mjs <outDir>
import { chromium } from "@playwright/test";
import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const dir = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? ".");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const f of readdirSync(dir).filter((f) => /^[a-z]-.*\.html$/.test(f))) {
  await page.goto("file://" + resolve(dir, f));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(out, f.replace(".html", ".png")) });
  console.log(f);
}
await browser.close();
