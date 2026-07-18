#!/usr/bin/env node
/**
 * Generate static dependency graphs under dependency-graphs/.
 * Requires Graphviz (`dot`) on PATH for SVG output.
 *
 * Note: a fully uncollapsed dependency-cruiser DOT for this repo is too large
 * for Graphviz to layout in a reasonable time — cruise SVGs use collapsed /
 * directory reporters instead. Use `pnpm run deps:skott` for interactive drill-down.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dependency-graphs");
const excludeTests = "\\.(test|spec)\\.(ts|tsx)$";

function run(command, args, { cwd = root, stdio = "inherit" } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || "";
    throw new Error(
      `${command} ${args.join(" ")} failed (exit ${result.status})${
        detail ? `\n${detail}` : ""
      }`
    );
  }
  return result;
}

function requireDot() {
  const check = spawnSync("dot", ["-V"], { encoding: "utf8" });
  if (check.status !== 0) {
    throw new Error(
      "Graphviz `dot` is required for SVG graphs. Install it (e.g. `brew install graphviz` or `sudo apt-get install graphviz`), then re-run."
    );
  }
}

function depcruiseDot(extraArgs) {
  return run(
    "pnpm",
    [
      "exec",
      "depcruise",
      "src",
      "--include-only",
      "^src",
      "--exclude",
      excludeTests,
      ...extraArgs,
    ],
    { stdio: ["ignore", "pipe", "inherit"] }
  ).stdout;
}

function dotToSvg(dotSource, outFile) {
  const svg = spawnSync("dot", ["-Tsvg"], {
    cwd: root,
    input: dotSource,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (svg.status !== 0) {
    throw new Error(`dot failed for ${outFile}: ${svg.stderr}`);
  }
  return writeFile(outFile, svg.stdout);
}

async function main() {
  requireDot();
  await mkdir(outDir, { recursive: true });

  console.log("→ madge SVG (full module graph)…");
  run("pnpm", [
    "exec",
    "madge",
    "--ts-config",
    "tsconfig.app.json",
    "--extensions",
    "ts,tsx",
    "--exclude",
    "(^|/)(test/|.*\\.(test|spec)\\.(ts|tsx)$)",
    "--image",
    path.join(outDir, "madge.svg"),
    "src",
  ]);

  console.log("→ dependency-cruiser directory graph SVG…");
  await dotToSvg(
    depcruiseDot(["-T", "ddot"]),
    path.join(outDir, "folders.svg")
  );

  console.log("→ dependency-cruiser collapsed module SVG (depth 3)…");
  await dotToSvg(
    depcruiseDot(["-T", "dot", "--collapse", "3"]),
    path.join(outDir, "cruise.svg")
  );

  console.log("→ dependency-cruiser architecture SVG…");
  await dotToSvg(depcruiseDot(["-T", "archi"]), path.join(outDir, "archi.svg"));

  console.log("→ dependency-cruiser Mermaid (collapsed depth 3)…");
  run("pnpm", [
    "exec",
    "depcruise",
    "src",
    "--include-only",
    "^src",
    "--exclude",
    excludeTests,
    "-T",
    "mermaid",
    "--collapse",
    "3",
    "-f",
    path.join(outDir, "cruise.mmd"),
  ]);

  console.log(`\nWrote graphs to ${path.relative(root, outDir)}/`);
  console.log("  madge.svg    — full module import graph (madge)");
  console.log("  folders.svg  — directory-level edges (dependency-cruiser)");
  console.log("  cruise.svg   — modules collapsed to depth 3");
  console.log("  archi.svg    — high-level area / folder clusters");
  console.log(
    "  cruise.mmd   — Mermaid source (paste into a Mermaid renderer)"
  );
  console.log("\nFor interactive drill-down: pnpm run deps:skott");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
