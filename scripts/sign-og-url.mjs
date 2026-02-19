#!/usr/bin/env node

import { createHmac } from 'node:crypto';

function printUsage() {
  console.log(`Usage:
  bun scripts/sign-og-url.mjs --url "<full-og-url>" [--secret "<hmac-secret>"] [--exp "<unix-seconds>"] [--exp-seconds "<seconds-from-now>"]

Examples:
  bun scripts/sign-og-url.mjs --url "https://example.com/api/og_9f3k?title=Hello&site=Blog"
  bun scripts/sign-og-url.mjs --url "https://example.com/api/og_9f3k?title=Hello&site=Blog" --exp-seconds 604800
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function canonicalizeSearchParams(searchParams) {
  const entries = [];
  for (const [key, value] of searchParams.entries()) {
    if (key === 'sig' || key === 'ogKey') continue;
    entries.push([key, value]);
  }
  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    return a[0] < b[0] ? -1 : 1;
  });
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function buildSigningPayload(searchParams) {
  const canonicalQuery = canonicalizeSearchParams(searchParams);
  return canonicalQuery || '__empty__';
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h || !args.url) {
  printUsage();
  process.exit(args.url ? 0 : 1);
}

const secret = (args.secret ?? process.env.OG_SIGNATURE_SECRET ?? process.env.OG_SECRET ?? '').trim();
if (!secret) {
  console.error('Missing secret. Provide --secret or set OG_SIGNATURE_SECRET / OG_SECRET.');
  process.exit(1);
}

const url = new URL(args.url);
url.searchParams.delete('sig');

if (args.exp) {
  if (!/^\d+$/.test(args.exp)) {
    console.error('--exp must be unix seconds.');
    process.exit(1);
  }
  url.searchParams.set('exp', args.exp);
}

if (args['exp-seconds']) {
  if (!/^\d+$/.test(args['exp-seconds'])) {
    console.error('--exp-seconds must be an integer.');
    process.exit(1);
  }
  const exp = Math.floor(Date.now() / 1000) + Number(args['exp-seconds']);
  url.searchParams.set('exp', String(exp));
}

const payload = buildSigningPayload(url.searchParams);
const sig = sign(payload, secret);
url.searchParams.set('sig', sig);

console.log(url.toString());
