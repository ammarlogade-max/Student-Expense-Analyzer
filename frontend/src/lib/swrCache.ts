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

    if (!parsed?.ts || Date.now() - parsed.ts > maxAgeMs) {
      sessionStorage.removeItem(key(k));
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(k: string, data: T) {
  try {
    const record: CachedRecord<T> = {
      ts: Date.now(),
      data,
    };

    sessionStorage.setItem(key(k), JSON.stringify(record));
  } catch {
    // Ignore storage failures.
  }
}

export function invalidateCache(k?: string) {
  try {
    if (k) {
      sessionStorage.removeItem(key(k));
      return;
    }

    Object.keys(sessionStorage)
      .filter((storageKey) => storageKey.startsWith(PREFIX))
      .forEach((storageKey) => {
        sessionStorage.removeItem(storageKey);
      });
  } catch {
    // Ignore invalidation failures.
  }
}

export function refreshExpenseCaches() {
  invalidateCache();
}
