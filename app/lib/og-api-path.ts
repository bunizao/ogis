export const DEFAULT_OG_API_PATH = 'og';

const OG_API_PATH_PATTERN = /^[a-z0-9][a-z0-9_-]{0,127}$/i;

export function normalizeOgApiPath(value?: string | null): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return DEFAULT_OG_API_PATH;
  const cleaned = trimmed.replace(/^\/+|\/+$/g, '');
  if (!OG_API_PATH_PATTERN.test(cleaned)) return DEFAULT_OG_API_PATH;
  return cleaned;
}

export function buildOgApiEndpoint(path?: string | null): string {
  return `/api/${normalizeOgApiPath(path)}`;
}
