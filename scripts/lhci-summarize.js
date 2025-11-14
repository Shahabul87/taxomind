#!/usr/bin/env node
/*
 Summarize Lighthouse (LHCI) results for desktop and mobile runs.
 - Reads JSON LHR files from provided directories
 - Computes median for key metrics
 - Writes summary.json and optional delta vs baseline-summary.json
 Usage:
   node scripts/lhci-summarize.js --desktopDir=./lighthouse-results/desktop --mobileDir=./lighthouse-results/mobile --out=./lighthouse-results/summary.json
*/

const fs = require('fs');
const path = require('path');

function readArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    const [k, v] = a.split('=');
    out[k.replace(/^--/, '')] = v ?? true;
  }
  return out;
}

function loadLhrs(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function median(values) {
  if (!values.length) return null;
  const vals = [...values].sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

function summarizeSet(lhrs) {
  const get = (id) => lhrs.map(l => l.audits?.[id]?.numericValue).filter(n => typeof n === 'number');
  const catScore = lhrs.map(l => l.categories?.performance?.score).filter(n => typeof n === 'number');
  const toSec = v => v == null ? null : +(v / 1000).toFixed(2);

  return {
    runs: lhrs.length,
    performance: catScore.length ? +(median(catScore) * 100).toFixed(0) : null,
    fcp_s: toSec(median(get('first-contentful-paint'))),
    lcp_s: toSec(median(get('largest-contentful-paint'))),
    tbt_ms: median(get('total-blocking-time')),
    cls: median(lhrs.map(l => l.audits?.['cumulative-layout-shift']?.numericValue).filter(n => typeof n === 'number')),
    si_s: toSec(median(get('speed-index'))),
    tti_s: toSec(median(get('interactive'))),
    total_bytes_kb: (() => {
      const vals = get('total-byte-weight');
      return vals.length ? +(median(vals) / 1024).toFixed(0) : null;
    })(),
  };
}

function computeDelta(current, baseline) {
  if (!baseline) return null;
  const keys = ['performance','fcp_s','lcp_s','tbt_ms','cls','si_s','tti_s','total_bytes_kb'];
  const delta = {};
  for (const k of keys) {
    if (current[k] == null || baseline[k] == null) continue;
    delta[k] = +(current[k] - baseline[k]).toFixed(typeof current[k] === 'number' && !Number.isInteger(current[k]) ? 2 : 0);
  }
  return delta;
}

(function main(){
  const { desktopDir, mobileDir, out = './lighthouse-results/summary.json' } = readArgs();
  const desktopLhrs = loadLhrs(desktopDir);
  const mobileLhrs = loadLhrs(mobileDir);

  const summary = {
    generatedAt: new Date().toISOString(),
    desktop: summarizeSet(desktopLhrs),
    mobile: summarizeSet(mobileLhrs),
  };

  const baselinePath = path.join(path.dirname(out), 'baseline-summary.json');
  let delta = null;
  if (fs.existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      delta = {
        desktop: computeDelta(summary.desktop, baseline.desktop),
        mobile: computeDelta(summary.mobile, baseline.mobile),
      };
    } catch {}
  }
  if (delta) summary.delta = delta;

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  // If no baseline exists, write one for future comparisons
  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, JSON.stringify(summary, null, 2));
  }

  // Human-readable printout
  function fmt(label, obj){
    if (!obj || !Object.keys(obj).length) return `${label}: n/a`;
    return [
      `${label}: perf ${obj.performance ?? 'n/a'} | FCP ${obj.fcp_s ?? 'n/a'}s | LCP ${obj.lcp_s ?? 'n/a'}s | TBT ${obj.tbt_ms ?? 'n/a'}ms | CLS ${obj.cls ?? 'n/a'} | SI ${obj.si_s ?? 'n/a'}s | TTI ${obj.tti_s ?? 'n/a'}s | Bytes ${obj.total_bytes_kb ?? 'n/a'}KB`
    ].join('\n');
  }
  console.log(fmt('Desktop', summary.desktop));
  console.log(fmt('Mobile', summary.mobile));
  if (summary.delta) {
    const dx = summary.delta;
    const dxStr = (label, d) => !d ? '' : `${label} delta: perf ${d.performance ?? 'n/a'} | FCP ${d.fcp_s ?? 'n/a'}s | LCP ${d.lcp_s ?? 'n/a'}s | TBT ${d.tbt_ms ?? 'n/a'}ms | CLS ${d.cls ?? 'n/a'} | SI ${d.si_s ?? 'n/a'}s | TTI ${d.tti_s ?? 'n/a'}s | Bytes ${d.total_bytes_kb ?? 'n/a'}KB`;
    console.log(dxStr('Desktop', dx.desktop));
    console.log(dxStr('Mobile', dx.mobile));
  }
})();

