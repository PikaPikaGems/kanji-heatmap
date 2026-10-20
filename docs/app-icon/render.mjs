// Rasterizes the SVGs from make-svg.py into the PNG icons and favicon.ico.
// Usage: node docs/app-icon/render.mjs <outDir>
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
const out = resolve(process.argv[2] ?? ".");
const PNGS = [
  ["app-icon", 512, "app-icon-512x512.png"],
  ["app-icon", 192, "app-icon-192x192.png"],
  ["app-icon", 96, "app-icon-96x96.png"],
  ["app-icon-maskable", 512, "app-icon-maskable-512x512.png"],
  ["app-icon-maskable", 192, "app-icon-maskable-192x192.png"],
  ["apple-touch-icon", 180, "apple-touch-icon.png"],
];
const ICO_SIZES = [16, 32, 48];
const browser = await chromium.launch();
const page = await browser.newPage();
async function png(name, size) {
  const svg = readFileSync(resolve(out, name + ".svg"), "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  return page.screenshot({ omitBackground: true });
}
for (const [name, size, file] of PNGS) {
  writeFileSync(resolve(out, file), await png(name, size));
  console.log(file);
}
// ICO with PNG-encoded entries: 6-byte header, 16-byte directory per image.
const images = [];
for (const size of ICO_SIZES) images.push(await png("favicon", size));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(ICO_SIZES[i], e);
  header.writeUInt8(ICO_SIZES[i], e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
writeFileSync(resolve(out, "favicon.ico"), Buffer.concat([header, ...images]));
console.log("favicon.ico");
await browser.close();
