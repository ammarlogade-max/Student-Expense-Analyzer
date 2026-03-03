type CachedRecord<T> = {
  ts: number;
  data: T;
};

const PREFIX = "expenseiq_cache:";

function key(k: string) {
  return `${PREFIX}${k}`;
}

export function readCache<T>(k: string, maxAgeMs = 5 * 60 * 1000): T | null {
  try {
    const raw = sessionStorage.getItem(key(k));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRecord<T>;
    if (!parsed?.ts || Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(k: string, data: T) {
  try {
    const record: CachedRecord<T> = { ts: Date.now(), data };
    sessionStorage.setItem(key(k), JSON.stringify(record));
  } catch {
    // Ignore storage failures.
  }
}
