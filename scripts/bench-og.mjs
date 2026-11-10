#!/usr/bin/env node
// Benchmark OG render latency per theme/font/content mix.
//
// Warm only, against a running server:
//   bun scripts/bench-og.mjs --base http://localhost:3000
// Cold + warm, spawning a fresh `next start` per cold sample (run `bun run build` first):
//   bun scripts/bench-og.mjs --cold 3
//
// Flags: --base <url>  --path /api/og  --warm <n>  --cold <n>  --port <n>
//        --only <substring>  --image <url>  --save <dir>

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const warmRuns = Number(args.warm ?? 10);
const coldRuns = Number(args.cold ?? 0);
const port = Number(args.port ?? 3100);
const routePath = args.path ?? '/api/og';
const imageUrl =
  args.image ?? 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&fm=jpg';

const CONTENT = {
  latin: {
    title: 'Shipping faster Open Graph images at the edge',
    site: 'Pixel Notes',
    excerpt: 'Notes on fonts, caching, and why cold starts matter for social previews.',
    author: 'Tutu',
    date: 'Oct 28, 2026',
  },
  zh: {
    title: '在边缘渲染像素字体：让社交预览图更快',
    site: '像素笔记',
    excerpt: '记录字体子集化、缓存策略，以及冷启动为什么会影响社交分享的预览速度。',
    author: '兔兔',
    date: '2026年10月28日',
  },
  ja: {
    title: 'ピクセルフォントで描く日本語のタイトル',
    site: 'ドット日記',
    excerpt: 'フォントの分割読み込みとキャッシュについての覚え書き。',
    author: 'うさぎ',
    date: '2026年10月28日',
  },
  emoji: {
    title: 'Launch day 🚀 pixels, fonts & coffee ☕️',
    site: 'Pixel Notes ✨',
    excerpt: 'Emoji should render as images, not tofu boxes 📦',
    author: 'Tutu',
    date: 'Oct 28, 2026',
  },
};

const FONTS = [
  { name: 'pixel-zpix', params: { theme: 'pixel', pixelFont: 'zpix' } },
  { name: 'pixel-geist', params: { theme: 'pixel', pixelFont: 'geist-square' } },
  { name: 'modern', params: { theme: 'modern' } },
];

const VARIANTS = [
  { name: 'latin', content: 'latin' },
  { name: 'latin+image', content: 'latin', image: true },
  { name: 'zh', content: 'zh' },
  { name: 'ja', content: 'ja' },
  { name: 'emoji', content: 'emoji' },
];

const cases = FONTS.flatMap(font =>
  VARIANTS.map(variant => {
    const params = { ...font.params, ...CONTENT[variant.content] };
    if (variant.image) params.image = imageUrl;
    return { name: `${font.name} ${variant.name}`, params };
  })
).filter(c => !args.only || c.name.includes(args.only));

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i].replace(/^--/, '');
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function percentile(values, p) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

function buildUrl(base, params, runId) {
  const url = new URL(routePath, base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  // Unique param defeats any HTTP cache without changing the rendered output.
  url.searchParams.set('bench', runId);
  return url;
}

async function timeRequest(url) {
  const start = performance.now();
  const response = await fetch(url);
  const body = new Uint8Array(await response.arrayBuffer());
  const ms = performance.now() - start;
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok || !type.startsWith('image/png') || body.length === 0) {
    throw new Error(`${response.status} ${type} (${body.length} bytes) for ${url}`);
  }
  return { ms, body };
}

async function waitForServer(base, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited with code ${child.exitCode}`);
    try {
      // A static file: proves the server is up without warming the OG route.
      const response = await fetch(new URL('/favicon.svg', base));
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not become ready in 30s');
}

async function withFreshServer(fn) {
  const base = `http://localhost:${port}`;
  const nextBin = resolve('node_modules/next/dist/bin/next');
  const child = spawn('node', [nextBin, 'start', '-p', String(port)], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  try {
    await waitForServer(base, child);
    return await fn(base);
  } finally {
    child.kill('SIGTERM');
    await new Promise(r => (child.exitCode !== null ? r() : child.once('exit', r)));
  }
}

async function measureWarm(base, testCase, label) {
  // One untimed request so the warm samples never include first-load work.
  await timeRequest(buildUrl(base, testCase.params, `${label}-prime`));
  const samples = [];
  let lastBody = null;
  for (let i = 0; i < warmRuns; i += 1) {
    const { ms, body } = await timeRequest(buildUrl(base, testCase.params, `${label}-${i}`));
    samples.push(ms);
    lastBody = body;
  }
  return { samples, lastBody };
}

async function run() {
  const results = [];
  for (const testCase of cases) {
    const cold = [];
    let warm = [];
    let pngBytes = 0;
    let lastBody = null;
    try {
      if (coldRuns > 0) {
        for (let i = 0; i < coldRuns; i += 1) {
          await withFreshServer(async base => {
            const first = await timeRequest(buildUrl(base, testCase.params, `cold-${i}`));
            cold.push(first.ms);
            if (i === coldRuns - 1 && warmRuns > 0) {
              ({ samples: warm, lastBody } = await measureWarm(base, testCase, `warm-${i}`));
            } else {
              lastBody = first.body;
            }
          });
        }
      } else {
        ({ samples: warm, lastBody } = await measureWarm(args.base ?? 'http://localhost:3000', testCase, 'warm'));
      }
      pngBytes = lastBody?.length ?? 0;
      if (args.save && lastBody) {
        mkdirSync(args.save, { recursive: true });
        writeFileSync(join(args.save, `${testCase.name.replace(/[^a-z0-9]+/gi, '_')}.png`), lastBody);
      }
      results.push({ name: testCase.name, cold, warm, pngBytes });
    } catch (error) {
      results.push({ name: testCase.name, error: String(error.message ?? error) });
    }
    const last = results[results.length - 1];
    process.stderr.write(`${last.error ? 'x' : '.'} ${testCase.name}${last.error ? `: ${last.error}` : ''}\n`);
  }
  printTable(results);
}

function fmt(value) {
  return Number.isFinite(value) ? `${Math.round(value)}` : '-';
}

function printTable(results) {
  console.log(`\nwarm n=${warmRuns}, cold n=${coldRuns} (ms, full body received)\n`);
  console.log('| case | cold p50 | cold p95 | warm p50 | warm p95 | png KB |');
  console.log('|---|---:|---:|---:|---:|---:|');
  for (const r of results) {
    if (r.error) {
      console.log(`| ${r.name} | error: ${r.error} |||||`);
      continue;
    }
    console.log(
      `| ${r.name} | ${fmt(percentile(r.cold, 50))} | ${fmt(percentile(r.cold, 95))} | ` +
        `${fmt(percentile(r.warm, 50))} | ${fmt(percentile(r.warm, 95))} | ${fmt(r.pngBytes / 1024)} |`
    );
  }
}

await run();
