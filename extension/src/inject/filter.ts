/**
 * Request filtering and deduplication.
 * Decides which URLs to skip (static resources, analytics, CDNs)
 * and throttles high-frequency duplicate patterns.
 */

const STATIC_RESOURCE_EXTENSIONS = /\.(?:js|css|png|jpe?g|gif|webp|ico|svg|woff2?|eot|ttf|otf|map)(?:[?#].*)?$/i;

const ANALYTICS_KEYWORDS = [
  'google-analytics', 'googletagmanager', 'googlesyndication', 'doubleclick',
  'sentry.io', 'hotjar.com', 'mixpanel.com', 'segment.com', 'segment.io',
  'amplitude.com', 'fullstory.com', 'intercom.io', 'crisp.chat',
  'hubspot.com', 'clarity.ms', 'newrelic.com', 'datadoghq.com',
  'bugsnag.com', 'logrocket.io', 'heapanalytics.com', 'posthog.com',
  'connect.facebook.net', 'bat.bing.com', 'mc.yandex.ru',
  'splunkcloud.com', 'adora-cdn.com', 'transcend-cdn.com',
  'w3-reporting', 'proxsee.pscp.tv',
  // Media CDNs (not API calls)
  'video.twimg.com', 'abs.twimg.com', 'pbs.twimg.com',
  'googlevideo.com', 'ytimg.com',
];

// Dedup state
const recentCaptures = new Map<string, { count: number; lastTime: number }>();
const DEDUP_WINDOW_MS = 60_000;
const DEDUP_MAX_PER_WINDOW = 3;

function getCaptureKey(method: string, url: string): string {
  try {
    const u = new URL(url, location.href);
    return `${method} ${u.pathname}`;
  } catch {
    return `${method} ${url}`;
  }
}

export function shouldThrottle(method: string, url: string): boolean {
  const key = getCaptureKey(method, url);
  const now = Date.now();
  const entry = recentCaptures.get(key);

  if (!entry || (now - entry.lastTime > DEDUP_WINDOW_MS)) {
    recentCaptures.set(key, { count: 1, lastTime: now });
    if (recentCaptures.size > 200) {
      for (const [k, v] of recentCaptures) {
        if (now - v.lastTime > DEDUP_WINDOW_MS * 2) recentCaptures.delete(k);
      }
    }
    return false;
  }

  entry.count++;
  entry.lastTime = now;
  return entry.count > DEDUP_MAX_PER_WINDOW;
}

export function shouldSkipRequest(url: string, headers: Record<string, string> = {}): boolean {
  try {
    const parsed = new URL(url, location.href);
    const href = parsed.href.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    if (['chrome-extension:', 'moz-extension:', 'safari-extension:', 'data:', 'blob:'].includes(parsed.protocol)) {
      return true;
    }

    if (STATIC_RESOURCE_EXTENSIONS.test(pathname)) {
      return true;
    }

    const combined = `${href} ${hostname} ${JSON.stringify(headers).toLowerCase()}`;
    return ANALYTICS_KEYWORDS.some((keyword) => combined.includes(keyword));
  } catch {
    return true;
  }
}
