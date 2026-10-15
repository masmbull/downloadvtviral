// Shared in-memory store — works within a single serverless instance
// Note: resets on cold starts; use a DB for persistence

export const visits: Array<{ ip: string; userAgent: string; timestamp: number }> = [];
export const downloads: Array<{ platform: string; title: string; timestamp: number }> = [];

const MAX_RECORDS = 1000;

export function recordVisit(ip: string, userAgent: string) {
  visits.unshift({ ip, userAgent, timestamp: Date.now() });
  if (visits.length > MAX_RECORDS) visits.length = MAX_RECORDS;
}

export function recordDownload(platform: string, title: string) {
  downloads.unshift({ platform, title, timestamp: Date.now() });
  if (downloads.length > MAX_RECORDS) downloads.length = MAX_RECORDS;
}

export function countDownloadsByPlatform(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of downloads) {
    counts[d.platform] = (counts[d.platform] || 0) + 1;
  }
  return counts;
}

export function visitorStats() {
  const now = Date.now();
  return {
    totalVisits: visits.length,
    uniqueVisitors: new Set(visits.map((v) => v.ip)).size,
    last5Minutes: visits.filter((v) => now - v.timestamp < 5 * 60 * 1000).length,
  };
}