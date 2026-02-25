import Dexie from 'dexie';
import type { CapturedRequest, CapturedRequestRecord } from '../types';
import { MAX_CAPTURE_BODY_BYTES } from '../types';

export class NeoDatabase extends Dexie {
  capturedRequests!: Dexie.Table<CapturedRequestRecord, string>;

  constructor() {
    super('neo-capture-v01');
    this.version(1).stores({
      capturedRequests: 'id, tabId, domain, timestamp, method, [domain+timestamp]',
    });
  }
}

export const db = new NeoDatabase();

export function truncateText(value: string, maxBytes = MAX_CAPTURE_BODY_BYTES): string {
  if (value.length <= maxBytes) {
    return value;
  }

  return `${value.slice(0, maxBytes)}\n[truncated ${value.length - maxBytes} bytes]`;
}

export async function addCapture(record: CapturedRequest): Promise<string> {
  return db.capturedRequests.add({ ...record, createdAt: Date.now() });
}

export function normalizeCaptureValue(value: unknown, maxBytes = MAX_CAPTURE_BODY_BYTES): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return truncateText(value, maxBytes);
  }

  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);
      if (!json) {
        return value;
      }

      if (json.length > maxBytes) {
        return truncateText(json, maxBytes);
      }

      return value;
    } catch {
      return truncateText(String(value), maxBytes);
    }
  }

  return truncateText(String(value), maxBytes);
}
