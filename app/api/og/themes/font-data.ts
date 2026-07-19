const fontDataCache = new Map<string, Promise<ArrayBuffer | null>>();

// Cached across requests per edge isolate; failed fetches are evicted so they retry.
export async function fetchFontData(url: string): Promise<ArrayBuffer | null> {
  let pending = fontDataCache.get(url);
  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!response.ok) return null;
        return await response.arrayBuffer();
      } catch {
        return null;
      }
    })();
    fontDataCache.set(url, pending);
  }

  const data = await pending;
  if (!data) {
    fontDataCache.delete(url);
  }
  return data;
}

// Test hook: the cache is module-level, so isolated test cases must reset it.
export function clearFontDataCache(): void {
  fontDataCache.clear();
}
