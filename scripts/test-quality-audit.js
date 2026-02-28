#!/usr/bin/env node

/**
 * Test quality audit:
 * - finds test files with no test()/it() blocks
 * - finds forwarding-only files (imports only, no assertions)
 *
 * Usage:
 *   node scripts/test-quality-audit.js
 *   node scripts/test-quality-audit.js --strict
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getTestFiles() {
  const cmd = "rg --files __tests__ app components lib actions -g '**/*.{test,spec}.{ts,tsx,js,jsx}'";
  const raw = execSync(cmd, { encoding: 'utf8' }).trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean);
}

function isImportOnly(lines) {
  return lines.length > 0 && lines.every((line) => /^import\s+['"][^'"]+['"];?$/.test(line));
}

function analyzeFiles(files) {
  const zeroTestFiles = [];
  const forwardingFiles = [];
  const forwardingTargets = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const hasTestBlock = /\b(it|test)\s*\(/.test(content);
    if (hasTestBlock) continue;

    zeroTestFiles.push(file);
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (isImportOnly(lines)) {
      forwardingFiles.push(file);
      for (const line of lines) {
        const match = line.match(/^import\s+['"]([^'"]+)['"];?$/);
        if (!match) continue;
        const target = match[1];
        forwardingTargets.set(target, (forwardingTargets.get(target) || 0) + 1);
      }
    }
  }

  return { zeroTestFiles, forwardingFiles, forwardingTargets };
}

function printSummary(total, report) {
  console.log('Test Quality Audit');
  console.log('==================');
  console.log(`Total test files: ${total}`);
  console.log(`Files with no test()/it(): ${report.zeroTestFiles.length}`);
  console.log(`Forwarding-only test files: ${report.forwardingFiles.length}`);

  if (report.forwardingFiles.length > 0) {
    console.log('\nTop forwarding targets:');
    const topTargets = [...report.forwardingTargets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [target, count] of topTargets) {
      console.log(`  ${String(count).padStart(4)} ${target}`);
    }
  }
}

function printExamples(name, files) {
  if (files.length === 0) return;
  console.log(`\nSample ${name}:`);
  for (const file of files.slice(0, 20)) {
    console.log(`  ${file}`);
  }
}

function main() {
  const strict = process.argv.includes('--strict');
  const files = getTestFiles();
  const report = analyzeFiles(files);

  printSummary(files.length, report);
  printExamples('files with no test blocks', report.zeroTestFiles);

  if (strict && (report.zeroTestFiles.length > 0 || report.forwardingFiles.length > 0)) {
    process.exitCode = 1;
  }
}

main();
