// Live relay counters shared in-process. The relay (custom server)
// flushes traffic to Postgres via /internal/traffic; the latest
// snapshot of connection counters is kept here for the dashboard.

export type RelayStats = {
  active: number;
  total: number;
  lastReport: number;
  upSince: number;
  lastError: string | null;
};

const globalForRelay = globalThis as typeof globalThis & {
  __apiRelayStats?: RelayStats;
};

export function getRelayStats(): RelayStats {
  if (!globalForRelay.__apiRelayStats) {
    globalForRelay.__apiRelayStats = {
      active: 0,
      total: 0,
      lastReport: 0,
      upSince: 0,
      lastError: null,
    };
  }
  return globalForRelay.__apiRelayStats;
}

export function recordRelayReport(report: Partial<RelayStats>): void {
  const s = getRelayStats();
  if (typeof report.active === "number") s.active = report.active;
  if (typeof report.total === "number") s.total = report.total;
  if (typeof report.lastReport === "number") s.lastReport = report.lastReport;
  if (typeof report.upSince === "number") s.upSince = report.upSince;
  if (typeof report.lastError === "string") s.lastError = report.lastError;
}
