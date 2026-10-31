// Builds the optional study engine (accounts, sync, review piles) into
// .study-engine/dist, which vite.config.ts picks up. The engine repo is
// private, so this only runs when KH_STUDY_ENGINE_TOKEN is set (a read-only
// GitHub token, stored as a Cloudflare Pages secret). Without it, or when
// KH_STUDY_ENGINE_ENTRY already points at a local engine build, it does
// nothing and the app builds with accounts unavailable.
//
// With a token, any failure stops the build: a deploy that silently shipped
// without the engine would hide every account feature.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const REPO = "PikaPikaGems/experimental-engine";
// Engine API 15 (secondary reading cards, experimental-engine#97), on the
// engine's main. Bump together with the dexie, ts-fsrs and engine-contract
// pins in package.json.
const COMMIT = "668bf8954ae0e1cebdf69163ead787c3dfbe544a";
const DIR = ".study-engine";

const token = process.env.KH_STUDY_ENGINE_TOKEN;
if (process.env.KH_STUDY_ENGINE_ENTRY) process.exit(0);
if (!token) {
  console.log("[study-engine] No KH_STUDY_ENGINE_TOKEN; building without it.");
  process.exit(0);
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    console.error(`[study-engine] \`${command} ${args[0]}\` failed.`);
    process.exit(1);
  }
};

const built = () => {
  try {
    return (
      fs.readFileSync(`${DIR}/.built-commit`, "utf8").trim() === COMMIT &&
      fs.existsSync(`${DIR}/dist/engine/index.js`)
    );
  } catch {
    return false;
  }
};

if (built()) {
  console.log(`[study-engine] ${COMMIT.slice(0, 7)} already built.`);
  process.exit(0);
}

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR);

// The token goes in a header via env-only git config, so it never appears in
// a URL, argv or the build log.
const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
const gitAuthEnv = {
  ...process.env,
  GIT_CONFIG_COUNT: "1",
  GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
  GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
  GIT_TERMINAL_PROMPT: "0",
};

console.log(`[study-engine] Fetching ${REPO}@${COMMIT.slice(0, 7)}…`);
run("git", ["init", "--quiet"], { cwd: DIR });
run(
  "git",
  [
    "fetch",
    "--quiet",
    "--depth",
    "1",
    `https://github.com/${REPO}.git`,
    COMMIT,
  ],
  { cwd: DIR, env: gitAuthEnv }
);
run("git", ["checkout", "--quiet", "FETCH_HEAD"], { cwd: DIR });

console.log("[study-engine] Building…");
run("pnpm", ["install", "--frozen-lockfile"], { cwd: DIR });
run("pnpm", ["run", "build"], { cwd: DIR });
fs.writeFileSync(`${DIR}/.built-commit`, `${COMMIT}\n`);
console.log("[study-engine] Built into .study-engine/dist.");
