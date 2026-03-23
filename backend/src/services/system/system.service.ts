type RequestMetric = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
};

const MAX_RECENT_METRICS = 150;

const state = {
  startedAt: Date.now(),
  requestCount: 0,
  errorCount: 0,
  totalResponseTimeMs: 0,
  recent: [] as RequestMetric[]
};

export function recordRequestMetric(metric: Omit<RequestMetric, "createdAt">) {
  state.requestCount += 1;
  state.totalResponseTimeMs += metric.durationMs;
  state.recent.unshift({
    ...metric,
    createdAt: new Date().toISOString()
  });

  if (state.recent.length > MAX_RECENT_METRICS) {
    state.recent.length = MAX_RECENT_METRICS;
  }

  if (metric.statusCode >= 400) {
    state.errorCount += 1;
  }
}

export function recordUnhandledError() {
  state.errorCount += 1;
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

export function getSystemMetricsSnapshot() {
  const durations = state.recent.map((item) => item.durationMs);
  const memory = process.memoryUsage();

  return {
    uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
    requestCount: state.requestCount,
    errorCount: state.errorCount,
    averageResponseTimeMs: state.requestCount
      ? Number((state.totalResponseTimeMs / state.requestCount).toFixed(2))
      : 0,
    p95ResponseTimeMs: percentile(durations, 95),
    memoryUsageMb: {
      rss: Number((memory.rss / 1024 / 1024).toFixed(2)),
      heapUsed: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotal: Number((memory.heapTotal / 1024 / 1024).toFixed(2))
    },
    recentRequests: state.recent.slice(0, 20)
  };
}
