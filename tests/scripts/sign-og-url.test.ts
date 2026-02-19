import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'bun:test';

function canonicalize(searchParams: URLSearchParams): string {
  const entries: Array<[string, string]> = [];
  searchParams.forEach((value, key) => {
    if (key === 'sig' || key === 'ogKey') return;
    entries.push([key, value]);
  });

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

function signExpected(url: string, secret: string): string {
  const parsed = new URL(url);
  const canonical = canonicalize(parsed.searchParams);
  const payload = canonical || '__empty__';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

async function runSignScript(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn({
    cmd: ['bun', 'scripts/sign-og-url.mjs', ...args],
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

describe('scripts/sign-og-url.mjs', () => {
  test('generates deterministic signature for canonicalized query', async () => {
    const sourceUrl = 'https://example.com/api/og_x?site=Blog&title=Hello';
    const secret = 'test-secret';

    const result = await runSignScript(['--url', sourceUrl, '--secret', secret]);

    expect(result.exitCode).toBe(0);

    const signedUrl = new URL(result.stdout);
    const expectedSig = signExpected(signedUrl.toString(), secret);

    expect(signedUrl.searchParams.get('sig')).toBe(expectedSig);
  });

  test('supports exp-seconds and writes exp parameter', async () => {
    const sourceUrl = 'https://example.com/api/og_x?title=Hello&site=Blog';
    const now = Math.floor(Date.now() / 1000);

    const result = await runSignScript([
      '--url',
      sourceUrl,
      '--secret',
      'test-secret',
      '--exp-seconds',
      '120',
    ]);

    expect(result.exitCode).toBe(0);

    const signedUrl = new URL(result.stdout);
    const exp = Number(signedUrl.searchParams.get('exp'));

    expect(Number.isFinite(exp)).toBeTrue();
    expect(exp).toBeGreaterThanOrEqual(now + 119);
    expect(exp).toBeLessThanOrEqual(now + 121);
  });

  test('fails when secret is missing', async () => {
    const sourceUrl = 'https://example.com/api/og_x?title=Hello&site=Blog';
    const result = await runSignScript(['--url', sourceUrl], {
      OG_SECRET: '',
      OG_SIGNATURE_SECRET: '',
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr.includes('Missing secret')).toBeTrue();
  });

  test('fails on invalid --exp value', async () => {
    const sourceUrl = 'https://example.com/api/og_x?title=Hello&site=Blog';
    const result = await runSignScript([
      '--url',
      sourceUrl,
      '--secret',
      'test-secret',
      '--exp',
      'invalid',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.includes('--exp must be unix seconds.')).toBeTrue();
  });
});
