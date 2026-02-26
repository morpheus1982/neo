/**
 * Pure utility functions extracted from interceptor.ts for testability.
 * These have no DOM/browser dependencies and can be tested in Node.
 */

import { MAX_CAPTURE_BODY_BYTES } from './types';

// ── URL filtering ─────────────────────────────────────────────────

export const STATIC_RESOURCE_EXTENSIONS = /\.(?:js|css|png|jpe?g|gif|webp|ico|svg|woff2?|eot|ttf|otf|map)(?:[?#].*)?$/i;

export const ANALYTICS_KEYWORDS = [
  'google-analytics', 'googletagmanager', 'googlesyndication', 'doubleclick',
  'sentry.io', 'hotjar.com', 'mixpanel.com', 'segment.com', 'segment.io',
  'amplitude.com', 'fullstory.com', 'intercom.io', 'crisp.chat',
  'hubspot.com', 'clarity.ms', 'newrelic.com', 'datadoghq.com',
  'bugsnag.com', 'logrocket.io', 'heapanalytics.com', 'posthog.com',
  'connect.facebook.net', 'bat.bing.com', 'mc.yandex.ru',
  'splunkcloud.com', 'adora-cdn.com', 'transcend-cdn.com',
  'w3-reporting', 'proxsee.pscp.tv',
  'video.twimg.com', 'abs.twimg.com', 'pbs.twimg.com',
  'googlevideo.com', 'ytimg.com',
  'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com',
  'fonts.googleapis.com', 'fonts.gstatic.com',
  'analytics.google.com', 'stats.g.doubleclick.net',
  'pagead2.googlesyndication.com', 'adservice.google.com',
  'static.cloudflareinsights.com', 'rum.browser-intake-datadoghq.com',
  'app.launchdarkly.com', 'events.launchdarkly.com',
  'api.statsig.com', 'featuregates.org',
  'hdslb.com', 'bilivideo.com', 'bilivideo.cn', 'biliapi.net',
  'data.bilibili.com', 'cm.bilibili.com',
  'a-cdn.anthropic.com', 'a-cdn.claude.ai', 'statsig.anthropic.com',
  'api.honeycomb.io',
];

const SKIP_PROTOCOLS = new Set([
  'chrome-extension:', 'moz-extension:', 'safari-extension:', 'data:', 'blob:'
]);

// ── Header redaction ──────────────────────────────────────────────

export const REDACTED_HEADER_VALUE = '[REDACTED]';

const AUTH_HEADER_EXACT_NAMES = new Set([
  'authorization',
  'cookie',
  'x-csrf-token',
]);

const AUTH_HEADER_REGEX = /token|auth|key|secret|session/i;

export function shouldRedactAuthHeader(name: string): boolean {
  const lower = String(name || '').toLowerCase();
  if (!lower) return false;
  return AUTH_HEADER_EXACT_NAMES.has(lower) || AUTH_HEADER_REGEX.test(lower);
}

export function redactAuthHeaderValue(name: string, value: string): string {
  return shouldRedactAuthHeader(name) ? REDACTED_HEADER_VALUE : value;
}

export function redactAuthHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers || {})) {
    redacted[name] = redactAuthHeaderValue(name, String(value));
  }
  return redacted;
}

/**
 * Determine if a request URL should be skipped (not captured).
 * baseHref is used for relative URL resolution (defaults to empty).
 */
export function shouldSkipUrl(url: string, headers: Record<string, string> = {}, baseHref?: string): boolean {
  try {
    const parsed = new URL(url, baseHref || 'http://localhost');
    const href = parsed.href.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    if (SKIP_PROTOCOLS.has(parsed.protocol)) return true;
    if (STATIC_RESOURCE_EXTENSIONS.test(pathname)) return true;

    const combined = `${href} ${hostname} ${JSON.stringify(headers).toLowerCase()}`;
    return ANALYTICS_KEYWORDS.some((keyword) => combined.includes(keyword));
  } catch {
    return true;
  }
}

// ── Throttling ────────────────────────────────────────────────────

export function getCaptureKey(method: string, url: string, baseHref?: string): string {
  try {
    const u = new URL(url, baseHref || 'http://localhost');
    return `${method} ${u.pathname}`;
  } catch {
    return `${method} ${url}`;
  }
}

// ── Text processing ───────────────────────────────────────────────

export function truncateText(value: string, maxBytes: number = MAX_CAPTURE_BODY_BYTES): string {
  if (value.length <= maxBytes) return value;
  return `${value.slice(0, maxBytes)}\n[truncated ${value.length - maxBytes} bytes]`;
}

export function parseTextBody(raw: string, contentType?: string): unknown {
  const normalized = truncateText(raw);
  const lowerType = (contentType || '').toLowerCase();
  const looksJson = lowerType.includes('application/json') ||
    ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']')));

  if (looksJson) {
    try { return JSON.parse(raw); } catch { return normalized; }
  }
  return normalized;
}

export function parseResponseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.split('\r\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) continue;
    headers[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
  }
  return headers;
}

// ── Domain / URL helpers ──────────────────────────────────────────

export function deriveDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return 'unknown'; }
}

export function toAbsoluteUrl(url: string | URL, baseHref: string): string {
  try { return new URL(url, baseHref).toString(); } catch { return String(url); }
}

// ── DOM helpers (pure string operations) ──────────────────────────

export function getSelector(el: { id?: string; tagName: string; className?: string | object }): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return tag + cls;
}

export function getElementText(textContent: string | null | undefined): string | undefined {
  const text = (textContent || '').trim().slice(0, 50);
  return text || undefined;
}
