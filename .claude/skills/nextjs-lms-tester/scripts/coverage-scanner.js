#!/usr/bin/env node

/**
 * Coverage Gap Scanner for Next.js LMS
 * 
 * Scans the project and generates a coverage gap report.
 * Usage: node scripts/coverage-scanner.js [--json] [--critical-only]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const criticalOnly = args.includes('--critical-only');

// ---- Configuration ----
const CRITICAL_PATTERNS = [
  { glob: 'app/api/**/route.ts', label: 'API Routes', weight: 3 },
  { glob: 'app/**/actions.ts', label: 'Server Actions', weight: 3 },
  { glob: 'lib/auth*', label: 'Auth Logic', weight: 3 },
  { glob: '**/stripe/**/*.ts', label: 'Payment/Stripe', weight: 3 },
  { glob: '**/webhook*/**/*.ts', label: 'Webhooks', weight: 3 },
];

const IMPORTANT_PATTERNS = [
  { glob: 'components/**/*.tsx', label: 'Components', weight: 2 },
  { glob: 'hooks/**/*.ts', label: 'Custom Hooks', weight: 2 },
  { glob: 'lib/data/**/*.ts', label: 'Data Access', weight: 2 },
  { glob: 'packages/*/src/**/*.ts', label: 'SAM AI Packages', weight: 2 },
];

const STANDARD_PATTERNS = [
  { glob: 'lib/**/*.ts', label: 'Utilities', weight: 1 },
  { glob: 'lib/validations/**/*.ts', label: 'Validations', weight: 1 },
];

// ---- Helpers ----
function findFiles(pattern) {
  try {
    const result = execSync(
      `find . -path "./${pattern}" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -name "*.test.*" -not -name "*.spec.*" -not -path "*/__tests__/*" -not -path "*/__mocks__/*" 2>/dev/null`,
      { encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function hasTest(sourceFile) {
  const basename = path.basename(sourceFile).replace(/\.(ts|tsx)$/, '');
  const dir = path.dirname(sourceFile);
  
  // Check co-located test
  const colocated = [
    path.join(dir, `${basename}.test.ts`),
    path.join(dir, `${basename}.test.tsx`),
    path.join(dir, `${basename}.spec.ts`),
    path.join(dir, `${basename}.spec.tsx`),
  ];
  
  for (const testPath of colocated) {
    if (fs.existsSync(testPath)) return testPath;
  }
  
  // Check __tests__ directory
  try {
    const result = execSync(
      `find . -path "*/__tests__/*${basename}*test*" -not -path "*/node_modules/*" 2>/dev/null`,
      { encoding: 'utf8' }
    );
    const found = result.trim().split('\n').filter(Boolean);
    if (found.length > 0) return found[0];
  } catch {}
  
  return null;
}

function estimateEffort(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    const imports = (content.match(/import /g) || []).length;
    const asyncOps = (content.match(/await |async /g) || []).length;
    
    if (lines < 50 && asyncOps < 3) return 'S';
    if (lines < 150 && asyncOps < 8) return 'M';
    if (lines < 300) return 'L';
    return 'XL';
  } catch {
    return 'M';
  }
}

// ---- Main ----
function scan() {
  const allPatterns = criticalOnly
    ? CRITICAL_PATTERNS
    : [...CRITICAL_PATTERNS, ...IMPORTANT_PATTERNS, ...STANDARD_PATTERNS];

  const results = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, tested: 0, untested: 0, score: 0 },
    categories: [],
    gaps: [],
  };

  let weightedTotal = 0;
  let weightedTested = 0;

  for (const pattern of allPatterns) {
    const files = findFiles(pattern.glob);
    const category = {
      label: pattern.label,
      weight: pattern.weight,
      total: files.length,
      tested: 0,
      untested: 0,
      files: [],
    };

    for (const file of files) {
      const testFile = hasTest(file);
      if (testFile) {
        category.tested++;
      } else {
        category.untested++;
        const effort = estimateEffort(file);
        const gap = { file, category: pattern.label, weight: pattern.weight, effort };
        category.files.push(gap);
        results.gaps.push(gap);
      }
    }

    weightedTotal += category.total * pattern.weight;
    weightedTested += category.tested * pattern.weight;
    results.summary.total += category.total;
    results.summary.tested += category.tested;
    results.summary.untested += category.untested;
    results.categories.push(category);
  }

  results.summary.score = weightedTotal > 0
    ? Math.round((weightedTested / weightedTotal) * 100)
    : 0;

  // Sort gaps by weight (critical first), then effort (small first)
  const effortOrder = { S: 0, M: 1, L: 2, XL: 3 };
  results.gaps.sort((a, b) =>
    b.weight - a.weight || effortOrder[a.effort] - effortOrder[b.effort]
  );

  return results;
}

// ---- Output ----
const results = scan();

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const grade = results.summary.score >= 80 ? '🟢 A' :
                results.summary.score >= 60 ? '🟡 B' :
                results.summary.score >= 40 ? '🟠 C' :
                results.summary.score >= 20 ? '🔴 D' : '⛔ F';

  console.log(`\n📊 Coverage Gap Report`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Score: ${results.summary.score}/100 (${grade})`);
  console.log(`Files: ${results.summary.tested}/${results.summary.total} tested (${results.summary.untested} gaps)\n`);

  for (const cat of results.categories) {
    const pct = cat.total > 0 ? Math.round((cat.tested / cat.total) * 100) : 100;
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(`${cat.label.padEnd(20)} ${bar} ${pct}% (${cat.tested}/${cat.total}) [${cat.weight}x]`);
  }

  if (results.gaps.length > 0) {
    console.log(`\n🔴 Top Gaps to Fix:`);
    const top = results.gaps.slice(0, 15);
    for (const gap of top) {
      console.log(`  [${gap.effort}] ${gap.file} (${gap.category})`);
    }
    if (results.gaps.length > 15) {
      console.log(`  ... and ${results.gaps.length - 15} more`);
    }
  }

  console.log('');
}
