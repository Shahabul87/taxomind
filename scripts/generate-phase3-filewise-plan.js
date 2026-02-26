#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const COVERAGE_SUMMARY_PATH = path.join(ROOT, "coverage", "coverage-summary.json");
const OUTPUT_DIR = path.join(ROOT, "docs", "testing");
const CSV_OUT = path.join(OUTPUT_DIR, "PHASE3_FILEWISE_TEST_MATRIX.csv");
const MD_OUT = path.join(OUTPUT_DIR, "PHASE3_TEST_PLAN_NOW.md");

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
const ACTION_ORDER = {
  create_test_file: 0,
  add_direct_test_file: 1,
  expand_existing_tests: 2,
  tune_existing_tests: 3,
  maintain: 4,
  none: 5,
};

const GENERIC_SOURCE_STEMS = new Set([
  "index",
  "route",
  "page",
  "layout",
  "loading",
  "error",
  "template",
  "provider",
  "types",
  "constants",
  "utils",
  "helpers",
]);

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "coverage" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === "backups"
    ) {
      continue;
    }
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, out);
    } else {
      out.push(abs);
    }
  }
  return out;
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function isRuntimeSourceFile(relPath) {
  return (
    /^(app|components|lib|actions)\//.test(relPath) &&
    /\.(js|jsx|ts|tsx)$/.test(relPath) &&
    !/\.d\.ts$/.test(relPath) &&
    !/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(relPath) &&
    !relPath.includes("/__tests__/")
  );
}

function extForTest(relPath) {
  return relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? "tsx" : "ts";
}

function removeExt(relPath) {
  return relPath.replace(/\.[^.]+$/, "");
}

function routeNameFromPath(relPath) {
  if (!relPath.startsWith("app/api/")) return null;
  let routeRel = relPath.replace(/^app\/api\//, "").replace(/\.(js|jsx|ts|tsx)$/, "");
  if (routeRel.endsWith("/route")) {
    routeRel = routeRel.slice(0, -"/route".length);
  }
  return routeRel.length ? routeRel : "index";
}

function recommendedTestFile(relPath) {
  const testExt = extForTest(relPath);
  if (relPath.startsWith("app/api/")) {
    const routeName = routeNameFromPath(relPath);
    return `__tests__/api/${routeName}.test.ts`;
  }
  if (relPath.startsWith("actions/")) {
    const stem = path.basename(removeExt(relPath));
    return `__tests__/actions/${stem}.test.ts`;
  }
  if (relPath.startsWith("lib/")) {
    return `__tests__/${removeExt(relPath)}.test.${testExt}`;
  }
  if (relPath.startsWith("components/")) {
    return `__tests__/${removeExt(relPath)}.test.tsx`;
  }
  if (relPath.startsWith("app/")) {
    return `__tests__/${removeExt(relPath)}.test.${testExt}`;
  }
  return `__tests__/${removeExt(relPath)}.test.${testExt}`;
}

function candidateTestFiles(relPath) {
  const testExt = extForTest(relPath);
  const noExt = removeExt(relPath);
  const stem = path.basename(noExt);
  const candidates = new Set([
    `${noExt}.test.${testExt}`,
    `${noExt}.spec.${testExt}`,
    `__tests__/${noExt}.test.${testExt}`,
    `__tests__/${noExt}.spec.${testExt}`,
    `__tests__/${stem}.test.${testExt}`,
    `__tests__/${stem}.spec.${testExt}`,
    `__tests__/${stem}.test.ts`,
    `__tests__/${stem}.test.tsx`,
  ]);

  if (relPath.startsWith("app/api/")) {
    const routeName = routeNameFromPath(relPath);
    candidates.add(`__tests__/api/${routeName}.test.ts`);
    candidates.add(`__tests__/api/${routeName}.test.tsx`);
    candidates.add(`__tests__/app/api/${routeName}/route.test.ts`);
    candidates.add(`__tests__/app/api/${routeName}/route.test.tsx`);
    const parts = routeName.split("/");
    const last = parts[parts.length - 1];
    candidates.add(`__tests__/api/${last}.test.ts`);
    candidates.add(`__tests__/api/${last}.test.tsx`);
  }

  if (relPath.startsWith("actions/")) {
    candidates.add(`__tests__/actions/${stem}.test.ts`);
    candidates.add(`__tests__/actions/${stem}.test.tsx`);
  }

  if (relPath.startsWith("lib/")) {
    const libRel = relPath.replace(/^lib\//, "");
    const libNoExt = removeExt(libRel);
    candidates.add(`__tests__/lib/${libNoExt}.test.ts`);
    candidates.add(`__tests__/lib/${libNoExt}.test.tsx`);
  }

  return Array.from(candidates);
}

function riskArea(relPath) {
  if (
    /^app\/api\//.test(relPath) ||
    /^actions\//.test(relPath) ||
    /webhook|stripe|billing|payment|checkout|auth|security|admin|queue/.test(relPath)
  ) {
    return "high";
  }
  if (/^lib\//.test(relPath) || /^hooks\//.test(relPath) || /^components\//.test(relPath)) {
    return "medium";
  }
  return "low";
}

function classify(row) {
  if (row.source_file.includes("/_deprecated/")) {
    return {
      status: "deprecated",
      action: "none",
      priority: "NONE",
      reason: "deprecated path",
    };
  }

  if (row.lines_total === 0) {
    return {
      status: "non_executable",
      action: "none",
      priority: "NONE",
      reason: "no executable lines in coverage map",
    };
  }

  const hasTest = row.has_test_file;
  const lp = row.lines_pct;
  const bp = row.branches_pct;
  const rp = row.risk_area;

  let status = "healthy";
  let action = "maintain";

  if (lp === 0) {
    status = hasTest ? "has_test_no_runtime_coverage" : "missing_test_file";
    action = hasTest ? "expand_existing_tests" : "create_test_file";
  } else if (lp < 40 || bp < 30) {
    status = "critical_coverage_gap";
    action = hasTest ? "expand_existing_tests" : "create_test_file";
  } else if (lp < 70 || bp < 55) {
    status = "coverage_gap";
    action = hasTest ? "tune_existing_tests" : "add_direct_test_file";
  } else if (!hasTest) {
    status = "indirect_coverage_only";
    action = "add_direct_test_file";
  }

  let score = 0;
  if (rp === "high") score += 3;
  else if (rp === "medium") score += 1;

  if (lp === 0) score += 4;
  else if (lp < 40) score += 3;
  else if (lp < 70) score += 2;
  else score += 1;

  if (bp < 30) score += 2;
  else if (bp < 55) score += 1;

  if (!hasTest) score += 2;

  if (action === "none") score = 0;
  if (action === "maintain") score = Math.min(score, 3);

  let priority = "LOW";
  if (action === "none") priority = "NONE";
  else if (score >= 8) priority = "HIGH";
  else if (score >= 5) priority = "MEDIUM";

  let reason;
  if (action === "create_test_file") {
    reason = hasTest
      ? "existing tests present but no/very low coverage"
      : "no direct test file and low coverage";
  } else if (action === "add_direct_test_file") {
    reason = "covered indirectly; add dedicated test file";
  } else if (action === "expand_existing_tests") {
    reason = "direct tests exist but coverage is critically low";
  } else if (action === "tune_existing_tests") {
    reason = "coverage is moderate; increase branch/edge-case tests";
  } else if (action === "maintain") {
    reason = "coverage and direct test linkage are acceptable";
  } else {
    reason = "not in active testing scope";
  }

  return { status, action, priority, reason };
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function pctOf(metric) {
  if (!metric || typeof metric.pct !== "number") return 0;
  return Number(metric.pct.toFixed(2));
}

function main() {
  if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
    throw new Error(`Missing coverage summary: ${COVERAGE_SUMMARY_PATH}`);
  }

  const coverageSummary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, "utf8"));
  const coverageEntries = Object.entries(coverageSummary)
    .filter(([k]) => k !== "total")
    .map(([absPath, cov]) => ({
      relPath: toPosix(path.relative(ROOT, absPath)),
      cov,
    }))
    .filter(({ relPath }) => isRuntimeSourceFile(relPath));

  const allFiles = walkFiles(ROOT).map((p) => toPosix(path.relative(ROOT, p)));
  const testFiles = allFiles.filter((p) => /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(p));
  const testFileSet = new Set(testFiles);
  const testBasenameSet = new Set(
    testFiles.map((t) => path.basename(t).replace(/\.(test|spec)\.(js|jsx|ts|tsx)$/, ""))
  );

  const rows = coverageEntries.map(({ relPath, cov }) => {
    const candidates = candidateTestFiles(relPath);
    const directCandidateMatch = candidates.some((c) => testFileSet.has(c));
    const sourceStem = path.basename(removeExt(relPath));
    const fuzzyMatch = !GENERIC_SOURCE_STEMS.has(sourceStem) && testBasenameSet.has(sourceStem);
    const hasTestFile = directCandidateMatch || fuzzyMatch;

    const row = {
      source_file: relPath,
      has_test_file: hasTestFile,
      recommended_test_file: recommendedTestFile(relPath),
      lines_pct: pctOf(cov.lines),
      branches_pct: pctOf(cov.branches),
      functions_pct: pctOf(cov.functions),
      statements_pct: pctOf(cov.statements),
      lines_covered: cov.lines ? cov.lines.covered : 0,
      lines_total: cov.lines ? cov.lines.total : 0,
      risk_area: riskArea(relPath),
    };

    const classified = classify(row);
    return { ...row, ...classified };
  });

  rows.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    const actionCmp = ACTION_ORDER[a.action] - ACTION_ORDER[b.action];
    if (actionCmp !== 0) return actionCmp;
    if (a.lines_pct !== b.lines_pct) return a.lines_pct - b.lines_pct;
    return a.source_file.localeCompare(b.source_file);
  });

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const headers = [
    "source_file",
    "has_test_file",
    "recommended_test_file",
    "lines_pct",
    "branches_pct",
    "functions_pct",
    "statements_pct",
    "lines_covered",
    "lines_total",
    "status",
    "action",
    "priority",
    "risk_area",
    "reason",
  ];

  const csv = [headers.join(",")]
    .concat(rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")))
    .join("\n");

  fs.writeFileSync(CSV_OUT, csv, "utf8");

  const createNow = rows.filter(
    (r) => r.action === "create_test_file" || r.action === "add_direct_test_file"
  );
  const improveNow = rows.filter(
    (r) => r.action === "expand_existing_tests" || r.action === "tune_existing_tests"
  );
  const highCreate = createNow.filter((r) => r.priority === "HIGH");
  const medCreate = createNow.filter((r) => r.priority === "MEDIUM");
  const highImprove = improveNow.filter((r) => r.priority === "HIGH");

  function tableRows(items, limit = 100) {
    return items.slice(0, limit).map((r) => {
      return `| \`${r.source_file}\` | \`${r.recommended_test_file}\` | ${r.lines_pct}% | ${r.branches_pct}% | ${r.priority} | ${r.reason} |`;
    });
  }

  const now = new Date().toISOString();
  const md = [
    "# Phase 3 Filewise Test Plan (Coverage-Driven)",
    "",
    `Generated: ${now}`,
    `Coverage source: \`coverage/coverage-summary.json\``,
    "",
    "## Snapshot",
    "",
    `- Runtime files analyzed: **${rows.length}**`,
    `- Create direct test files now: **${createNow.length}**`,
    `- Improve existing tests now: **${improveNow.length}**`,
    `- High priority create/add: **${highCreate.length}**`,
    `- Medium priority create/add: **${medCreate.length}**`,
    `- High priority improve: **${highImprove.length}**`,
    "",
    "## High Priority - Create/Add Test Files",
    "",
    "| Source File | Recommended Test File | Lines | Branches | Priority | Reason |",
    "|---|---|---:|---:|---|---|",
    ...tableRows(highCreate, 150),
    "",
    "## Medium Priority - Create/Add Test Files",
    "",
    "| Source File | Recommended Test File | Lines | Branches | Priority | Reason |",
    "|---|---|---:|---:|---|---|",
    ...tableRows(medCreate, 150),
    "",
    "## High Priority - Expand Existing Tests",
    "",
    "| Source File | Recommended Test File | Lines | Branches | Priority | Reason |",
    "|---|---|---:|---:|---|---|",
    ...tableRows(highImprove, 100),
    "",
    "## Full Matrix",
    "",
    `- CSV: \`${path.relative(ROOT, CSV_OUT)}\``,
    `- Includes every runtime source file with coverage and planned action.`,
    "",
  ].join("\n");

  fs.writeFileSync(MD_OUT, md, "utf8");

  const summary = {
    runtimeFiles: rows.length,
    createNow: createNow.length,
    improveNow: improveNow.length,
    highCreate: highCreate.length,
    mediumCreate: medCreate.length,
    highImprove: highImprove.length,
    csvOut: path.relative(ROOT, CSV_OUT),
    mdOut: path.relative(ROOT, MD_OUT),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
