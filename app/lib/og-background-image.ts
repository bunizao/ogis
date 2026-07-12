const DNS_TIMEOUT_MS = 2000;
const DNS_CACHE_TTL_MS = 10 * 60 * 1000;

type DnsCacheEntry = { expiresAt: number; ips: string[] };

export type OgBackgroundImage = {
  rawImage: string | null;
  reconstructedImage: string;
  isValidUrl: boolean;
  isSupportedFormat: boolean;
  imageAccepted: boolean;
  imageHost: string;
  backgroundImageSrc: string;
};

const dnsCache = new Map<string, DnsCacheEntry>();

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  const numbers: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value < 0 || value > 255) return null;
    numbers.push(value);
  }
  return numbers;
}

function isPublicIpv4(ip: string): boolean {
  const parts = parseIpv4(ip);
  if (!parts) return false;

  const [a, b, c] = parts;
  if (a === 0) return false;
  if (a === 10) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function ipv4ToHextets(ip: string): number[] | null {
  const parts = parseIpv4(ip);
  if (!parts) return null;
  return [(parts[0] << 8) | parts[1], (parts[2] << 8) | parts[3]];
}

function parseIpv6(ip: string): number[] | null {
  const normalized = ip.toLowerCase();
  if (normalized.includes('%')) return null;

  const pieces = normalized.split('::');
  if (pieces.length > 2) return null;

  const left = pieces[0] ? pieces[0].split(':') : [];
  const right = pieces.length === 2 && pieces[1] ? pieces[1].split(':') : [];

  const collect = (parts: string[]) => {
    const hextets: number[] = [];
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      if (!part) return null;

      if (part.includes('.')) {
        if (index !== parts.length - 1) return null;
        const ipv4Hextets = ipv4ToHextets(part);
        if (!ipv4Hextets) return null;
        hextets.push(...ipv4Hextets);
        continue;
      }

      if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
      hextets.push(parseInt(part, 16));
    }
    return hextets;
  };

  const leftHextets = collect(left);
  const rightHextets = collect(right);
  if (!leftHextets || !rightHextets) return null;

  const total = leftHextets.length + rightHextets.length;
  if (pieces.length === 1) return total === 8 ? leftHextets : null;
  if (total > 8) return null;
  return [...leftHextets, ...new Array(8 - total).fill(0), ...rightHextets];
}

function isPublicIpv6(ip: string): boolean {
  const parts = parseIpv6(ip);
  if (!parts) return false;

  const [h0, h1, h2, h3, h4, h5, h6, h7] = parts;
  if (parts.every(part => part === 0)) return false;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0 && h6 === 0 && h7 === 1) {
    return false;
  }
  if ((h0 & 0xfe00) === 0xfc00) return false;
  if ((h0 & 0xffc0) === 0xfe80) return false;
  if ((h0 & 0xff00) === 0xff00) return false;
  if (h0 === 0x2001 && h1 === 0x0db8) return false;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0xffff) {
    const ipv4 = `${h6 >> 8}.${h6 & 0xff}.${h7 >> 8}.${h7 & 0xff}`;
    return isPublicIpv4(ipv4);
  }
  return true;
}

function isPublicIp(ip: string): boolean {
  return isPublicIpv4(ip) || isPublicIpv6(ip);
}

function isBlockedHostname(hostname: string): boolean {
  return !hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local');
}

async function fetchDnsRecords(hostname: string, recordType: 'A' | 'AAAA'): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DNS_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${recordType}`,
      {
        headers: { accept: 'application/dns-json' },
        cache: 'no-store',
        signal: controller.signal,
      }
    );
    if (!response.ok) return [];

    const data = (await response.json()) as {
      Status?: number;
      Answer?: { data?: string }[];
    };
    if (data.Status !== 0 || !Array.isArray(data.Answer)) return [];

    const entries = data.Answer
      .map(answer => answer.data)
      .filter((value): value is string => typeof value === 'string');
    return recordType === 'A'
      ? entries.filter(entry => parseIpv4(entry))
      : entries.filter(entry => parseIpv6(entry));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveHostname(hostname: string): Promise<string[]> {
  const now = Date.now();
  const cached = dnsCache.get(hostname);
  if (cached && cached.expiresAt > now) return cached.ips;
  if (cached) dnsCache.delete(hostname);

  const [ipv4Records, ipv6Records] = await Promise.all([
    fetchDnsRecords(hostname, 'A'),
    fetchDnsRecords(hostname, 'AAAA'),
  ]);
  const ips = [...ipv4Records, ...ipv6Records];

  if (ips.length > 0) {
    dnsCache.set(hostname, { expiresAt: now + DNS_CACHE_TTL_MS, ips });
  }
  return ips;
}

async function parsePublicImageUrl(value: string): Promise<URL | null> {
  if (!value || value.endsWith('…') || value.endsWith('...') || value.length < 20) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.port && !['80', '443'].includes(parsed.port)) return null;

    const hostname = normalizeHostname(parsed.hostname);
    if (isBlockedHostname(hostname)) return null;
    if (parseIpv4(hostname)) return isPublicIpv4(hostname) ? parsed : null;
    if (parseIpv6(hostname)) return isPublicIpv6(hostname) ? parsed : null;

    const ips = await resolveHostname(hostname);
    if (!ips.length || !ips.every(isPublicIp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function reconstructImageUrl(searchParams: URLSearchParams): string {
  const rawImage = searchParams.get('image') ?? '';

  try {
    const parsed = new URL(rawImage);
    if (parsed.hostname !== 'images.unsplash.com') return rawImage;
  } catch {
    return rawImage;
  }

  const knownParams = ['crop', 'cs', 'fit', 'fm', 'ixid', 'ixlib', 'q', 'w', 'h'];
  const recoveredParams = knownParams.flatMap(param => {
    const value = searchParams.get(param);
    return value ? [`${param}=${value}`] : [];
  });
  return recoveredParams.length > 0 ? `${rawImage}&${recoveredParams.join('&')}` : rawImage;
}

function isSupportedImageFormat(value: string): boolean {
  if (!value) return false;

  const lowerUrl = value.toLowerCase();
  if (lowerUrl.includes('/format/jpeg/') || lowerUrl.includes('/format/png/') || lowerUrl.includes('/format/jpg/')) {
    return true;
  }
  if (/\.(webp|avif)(\?|$)/i.test(lowerUrl)) return false;

  const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  const hasSupportedExtension = supportedExtensions.some(extension => lowerUrl.includes(extension));
  return hasSupportedExtension || !/\.(webp|avif|svg|bmp|tiff?)(\?|$)/i.test(lowerUrl);
}

export async function resolveOgBackgroundImage(requestUrl: URL): Promise<OgBackgroundImage> {
  const rawImage = requestUrl.searchParams.get('image');
  const reconstructedImage = reconstructImageUrl(requestUrl.searchParams);
  const allowedImageUrl = await parsePublicImageUrl(reconstructedImage);
  const isSupportedFormat = isSupportedImageFormat(reconstructedImage);
  const acceptedImageUrl = allowedImageUrl && isSupportedFormat ? allowedImageUrl : null;

  return {
    rawImage,
    reconstructedImage,
    isValidUrl: Boolean(allowedImageUrl),
    isSupportedFormat,
    imageAccepted: Boolean(acceptedImageUrl),
    imageHost: allowedImageUrl?.hostname ?? '',
    backgroundImageSrc:
      acceptedImageUrl?.toString() ?? new URL('/default-bg.jpg', requestUrl.origin).toString(),
  };
}
