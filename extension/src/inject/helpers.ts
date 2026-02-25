/**
 * Shared helpers for all interceptors.
 * URL normalization, body parsing, header handling, ID generation, capture emission.
 */

import { CapturedRequest, MAX_CAPTURE_BODY_BYTES, NEO_CAPTURE_MESSAGE_TYPE } from '../types';
import { normalizeCaptureValue } from '../utils';
import { shouldThrottle } from './filter';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `neo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function truncateText(value: string): string {
  if (value.length <= MAX_CAPTURE_BODY_BYTES) return value;
  return `${value.slice(0, MAX_CAPTURE_BODY_BYTES)}\n[truncated ${value.length - MAX_CAPTURE_BODY_BYTES} bytes]`;
}

export function toAbsoluteUrl(url: string | URL): string {
  try {
    return new URL(url, location.href).toString();
  } catch {
    return String(url);
  }
}

export function deriveDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

export function parseHeaders(headers?: Headers | Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  const entries = headers instanceof Headers ? headers.entries() : Object.entries(headers);
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
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

export function normalizeBodySync(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === 'string') return truncateText(value);
  if (value instanceof URLSearchParams) return truncateText(value.toString());
  if (value instanceof FormData) {
    const obj: Record<string, string> = {};
    value.forEach((item, key) => { obj[key] = String(item); });
    return obj;
  }
  if (value instanceof Blob) return `[Blob ${value.size} bytes]`;
  if (value instanceof ArrayBuffer) {
    try { return truncateText(new TextDecoder().decode(new Uint8Array(value))); }
    catch { return '[arraybuffer body]'; }
  }
  if (ArrayBuffer.isView(value)) {
    try { return truncateText(new TextDecoder().decode(value as ArrayBufferView)); }
    catch { return '[typed array body]'; }
  }
  if (typeof value === 'object') {
    try { return normalizeCaptureValue(value); }
    catch { return '[unserializable body]'; }
  }
  return truncateText(String(value));
}

export async function normalizeRequestBody(value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    try {
      const text = await value.text();
      return parseTextBody(text, value.type);
    } catch {
      return '[unreadable blob]';
    }
  }
  return normalizeBodySync(value);
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

export function emitCapture(payload: CapturedRequest): void {
  if (shouldThrottle(payload.method, payload.url)) return;
  try {
    window.postMessage({ type: NEO_CAPTURE_MESSAGE_TYPE, payload }, '*');
  } catch {
    // ignore cross-context postMessage issues
  }
}
