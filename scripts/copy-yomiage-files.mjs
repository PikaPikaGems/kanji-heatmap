// Puts yomiage's voice files (~65 MB in parts of at most 20 MB) and its engine
// worker into public/yomiage/, which the AI voice loads from at /yomiage/.
// `yomiage copy-files` downloads them once per version into ~/.cache/yomiage
// and only checks sizes when the folder is already up to date.
//
// The AI voice is experimental and the app falls back to the browser voice
// without these files, so a failed download (e.g. offline) must not stop a
// dev server. A deployable build is different: shipping without them would
// silently break AI Voice Mode, so CI fails loudly instead.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const CLI = "node_modules/yomiage/bin/yomiage.mjs";
const DEST = "public/yomiage";

const fail = (message) => {
  if (process.env.CI) {
    console.error(`[yomiage] ${message} Refusing to build without it.`);
    process.exit(1);
  }
  console.warn(
    `\n[yomiage] ${message} AI Voice Mode will fall back to the browser voice.\n`
  );
  process.exit(0);
};

if (!fs.existsSync(CLI)) {
  fail("yomiage is not installed, so its voice files cannot be copied.");
}

const result = spawnSync(process.execPath, [CLI, "copy-files", DEST], {
  stdio: "inherit",
});
if (result.status !== 0) {
  fail(`Copying the voice files into ${DEST} failed.`);
}
