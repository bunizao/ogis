import { DEFAULT_OG_API_PATH, normalizeOgApiPath } from './og-api-path';

type EnvironmentMap = Record<string, string | undefined>;

export type OgSecurityConfig = {
  primaryRouteKey: string;
  signatureSecret: string;
  hasSignatureProtection: boolean;
};

// Stable non-cryptographic hash for deriving a deterministic route key from OG_SECRET.
function hashToBase36(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < seed.length; i += 1) {
    const c = seed.charCodeAt(i);
    h1 ^= c;
    h2 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const a = (h1 >>> 0).toString(36);
  const b = (h2 >>> 0).toString(36);
  return `${a}${b}`.toLowerCase();
}

export function deriveOgApiPathFromSecret(secret: string): string {
  const normalized = secret.trim();
  if (!normalized) return DEFAULT_OG_API_PATH;
  const suffix = hashToBase36(normalized).slice(0, 12).padEnd(12, '0');
  return `og_${suffix}`;
}

export function resolveOgSecurityConfig(
  env: EnvironmentMap = process.env
): OgSecurityConfig {
  const unifiedSecret = (env.OG_SECRET ?? '').trim();
  const explicitPathRaw = (env.OG_API_PATH ?? '').trim();
  const explicitPath = explicitPathRaw ? normalizeOgApiPath(explicitPathRaw) : '';

  const primaryRouteKey =
    explicitPath || (unifiedSecret ? deriveOgApiPathFromSecret(unifiedSecret) : DEFAULT_OG_API_PATH);

  const signatureSecret = (env.OG_SIGNATURE_SECRET ?? unifiedSecret).trim();
  const hasSignatureProtection = signatureSecret.length > 0;

  return {
    primaryRouteKey,
    signatureSecret,
    hasSignatureProtection,
  };
}
