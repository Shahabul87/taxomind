#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000';

const TASKS = new Set(['checkins', 'rollups', 'proactive', 'all']);

const task = process.argv[2] || 'all';

if (!TASKS.has(task)) {
  console.error('Usage: node scripts/sam-cron-runner.js [checkins|rollups|proactive|all]');
  process.exit(1);
}

const baseUrl = (process.env.SAM_CRON_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const cronSecret = process.env.CRON_SECRET || process.env.CRON_API_KEY;
const timeoutMs = Number(process.env.SAM_CRON_TIMEOUT_MS || '45000');

const headers = {
  'content-type': 'application/json',
};

if (cronSecret) {
  headers.authorization = `Bearer ${cronSecret}`;
}

function buildUrl(path, params) {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function callEndpoint(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(`[SAM_CRON] ${url} failed: ${response.status} ${response.statusText}`);
      if (body) {
        console.error(body);
      }
      process.exitCode = 1;
      return;
    }

    if (body) {
      console.log(body);
    }
  } catch (error) {
    console.error(`[SAM_CRON] ${url} failed:`, error);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function run() {
  if (task === 'checkins' || task === 'all') {
    const url = buildUrl('/api/cron/sam-checkins');
    await callEndpoint(url);
  }

  if (task === 'rollups' || task === 'all') {
    const period = process.env.SAM_ROLLUP_PERIOD || 'daily';
    const limit = process.env.SAM_ROLLUP_LIMIT;
    const url = buildUrl('/api/cron/sam-analytics-rollups', {
      period,
      limit,
    });
    await callEndpoint(url);
  }

  if (task === 'proactive' || task === 'all') {
    const limit = process.env.SAM_PROACTIVE_LIMIT;
    const notify = process.env.SAM_PROACTIVE_NOTIFY;
    const url = buildUrl('/api/cron/sam-proactive', {
      limit,
      notify,
    });
    await callEndpoint(url);
  }
}

run().catch((error) => {
  console.error('[SAM_CRON] Unexpected error:', error);
  process.exit(1);
});
