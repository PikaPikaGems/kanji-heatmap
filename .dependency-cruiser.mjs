/** @type {import("dependency-cruiser").IConfiguration} */
export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "warn",
      comment:
        "Circular dependencies make extraction and folder moves harder. Prefer breaking the cycle.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "info",
      comment:
        "Orphan modules are unused from the rest of the graph (entrypoints and tests excluded).",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)main\\.tsx$",
          "(^|/)vite-env\\.d\\.ts$",
          "\\.d\\.ts$",
          "\\.(test|spec)\\.(ts|tsx)$",
          "(^|/)test/",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },
    exclude: {
      path: ["node_modules", "dependency-graphs", "dist", "coverage"],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.app.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
        theme: {
          graph: {
            splines: "ortho",
            rankdir: "LR",
          },
        },
      },
      archi: {
        // Folder-level view for spotting misplaced modules / boundary issues
        collapsePattern:
          "^src/(components/[^/]+|hooks|lib|providers|kanji-worker|types)(/|$)",
      },
    },
  },
};
