import { addCapture, db } from '../db';
import { isNeoCaptureMessage, NEO_CAPTURE_MESSAGE_TYPE, CapturedRequest } from '../types';
import { redactAuthHeaders } from '../interceptor-utils';

const tabCaptureCounts = new Map<number, number>();

// ── Bridge WebSocket Client ─────────────────────────────────────
const BRIDGE_URL = 'ws://127.0.0.1:9234';
const BRIDGE_RECONNECT_MS = 5000;
const BRIDGE_MAX_RECONNECT_MS = 60000;

let bridgeWs: WebSocket | null = null;
let bridgeReconnectDelay = BRIDGE_RECONNECT_MS;
let bridgeReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let bridgeConnected = false;

function bridgeConnect(): void {
  if (bridgeWs && (bridgeWs.readyState === WebSocket.CONNECTING || bridgeWs.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    bridgeWs = new WebSocket(BRIDGE_URL);
  } catch {
    bridgeScheduleReconnect();
    return;
  }

  bridgeWs.onopen = () => {
    bridgeConnected = true;
    bridgeReconnectDelay = BRIDGE_RECONNECT_MS;
    console.log('[Neo Bridge] connected');
  };

  bridgeWs.onclose = () => {
    bridgeConnected = false;
    bridgeWs = null;
    bridgeScheduleReconnect();
  };

  bridgeWs.onerror = () => {
    // onclose will fire after this
  };

  bridgeWs.onmessage = (event) => {
    void handleBridgeMessage(event.data as string);
  };
}

function bridgeScheduleReconnect(): void {
  if (bridgeReconnectTimer) return;
  bridgeReconnectTimer = setTimeout(() => {
    bridgeReconnectTimer = null;
    bridgeConnect();
  }, bridgeReconnectDelay);
  bridgeReconnectDelay = Math.min(bridgeReconnectDelay * 1.5, BRIDGE_MAX_RECONNECT_MS);
}

function bridgeSend(type: string, data: unknown): void {
  if (!bridgeWs || bridgeWs.readyState !== WebSocket.OPEN) return;
  try {
    bridgeWs.send(JSON.stringify({ type, data }));
  } catch {
    // ignore send errors
  }
}

async function handleBridgeMessage(raw: string): Promise<void> {
  let msg: { id?: string; cmd: string; args?: Record<string, unknown> };
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  const reply = (result: unknown, error?: string) => {
    bridgeSend('response', { id: msg.id, result, error });
  };

  try {
    switch (msg.cmd) {
      case 'ping':
        reply('pong');
        break;
      case 'status': {
        const count = await db.capturedRequests.count();
        const domains = new Map<string, number>();
        await db.capturedRequests.each(c => {
          domains.set(c.domain, (domains.get(c.domain) || 0) + 1);
        });
        reply({ count, domains: Object.fromEntries(domains) });
        break;
      }
      case 'capture.count':
        reply(await db.capturedRequests.count());
        break;
      case 'capture.list': {
        const domain = msg.args?.domain as string | undefined;
        const limit = (msg.args?.limit as number) || 50;
        let collection = domain
          ? db.capturedRequests.where('domain').equals(domain)
          : db.capturedRequests.toCollection();
        const items = await collection.reverse().limit(limit).toArray();
        reply(items.map(c => ({
          id: c.id,
          method: c.method,
          url: c.url,
          status: c.responseStatus,
          duration: c.duration,
          source: c.source,
          timestamp: c.timestamp,
        })));
        break;
      }
      case 'capture.detail': {
        const id = msg.args?.id as string;
        if (!id) { reply(null, 'missing id'); break; }
        const item = await db.capturedRequests.get(id);
        reply(item || null);
        break;
      }
      case 'capture.domains': {
        const domains = new Map<string, number>();
        await db.capturedRequests.each(c => {
          domains.set(c.domain, (domains.get(c.domain) || 0) + 1);
        });
        const sorted = [...domains.entries()].sort((a, b) => b[1] - a[1]);
        reply(sorted.map(([d, c]) => ({ domain: d, count: c })));
        break;
      }
      case 'capture.clear': {
        const domain = msg.args?.domain as string | undefined;
        if (domain) {
          const ids = await db.capturedRequests.where('domain').equals(domain).primaryKeys();
          await db.capturedRequests.bulkDelete(ids);
          reply({ cleared: ids.length, domain });
        } else {
          await db.capturedRequests.clear();
          reply({ cleared: 'all' });
        }
        break;
      }
      case 'capture.search': {
        const query = (msg.args?.query as string || '').toLowerCase();
        const method = msg.args?.method as string | undefined;
        const limit = (msg.args?.limit as number) || 20;
        const results: Array<{ id: string; method: string; url: string; status: number; timestamp: number }> = [];
        await db.capturedRequests.reverse().each(c => {
          if (results.length >= limit) return;
          if (query && !c.url.toLowerCase().includes(query)) return;
          if (method && c.method.toUpperCase() !== method.toUpperCase()) return;
          results.push({ id: c.id, method: c.method, url: c.url, status: c.responseStatus, timestamp: c.timestamp });
        });
        reply(results);
        break;
      }
      default:
        reply(null, `unknown command: ${msg.cmd}`);
    }
  } catch (err) {
    reply(null, String(err));
  }
}

// Start bridge connection
bridgeConnect();

// ── Message Listener ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!isNeoCaptureMessage(message)) {
    return;
  }

  const incoming = message.payload;
  const tabId = typeof incoming.tabId === 'number'
    ? incoming.tabId
    : sender.tab?.id ?? -1;

  const capture: CapturedRequest = {
    ...incoming,
    tabId,
    tabUrl: incoming.tabUrl || sender.tab?.url || '',
  };

  void persistCapture(capture);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void refreshBadge(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabCaptureCounts.delete(tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  void hydrateCounts();
});

chrome.runtime.onStartup.addListener(() => {
  void hydrateCounts();
});

void hydrateCounts();

async function hydrateCounts(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (typeof tab.id !== 'number') {
        continue;
      }

      const count = await db.capturedRequests
        .where('tabId')
        .equals(tab.id)
        .count();

      if (count > 0) {
        tabCaptureCounts.set(tab.id, count);
      }
    }

    await refreshBadge();
  } catch (err) {
    console.error('[Neo] hydrateCounts failed:', err);
  }
}

async function refreshBadge(tabId?: number): Promise<void> {
  const targetTabId = typeof tabId === 'number' && tabId > 0 ? tabId : await getActiveTabId();
  if (typeof targetTabId !== 'number' || targetTabId < 0) {
    return;
  }

  const count = tabCaptureCounts.get(targetTabId)
    ?? await db.capturedRequests.where('tabId').equals(targetTabId).count();

  tabCaptureCounts.set(targetTabId, count);
  await chrome.action.setBadgeText({
    tabId: targetTabId,
    text: count > 0 ? String(count) : '',
  });

  await chrome.action.setBadgeBackgroundColor({
    color: '#2563EB',
    tabId: targetTabId,
  });
}

async function getActiveTabId(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

async function persistCapture(capture: CapturedRequest): Promise<void> {
  try {
    const persistedCapture: CapturedRequest = {
      ...capture,
      requestHeaders: redactAuthHeaders(capture.requestHeaders || {}),
    };

    await addCapture(persistedCapture);

    if (persistedCapture.tabId > -1) {
      const existing = tabCaptureCounts.get(persistedCapture.tabId) || 0;
      tabCaptureCounts.set(persistedCapture.tabId, existing + 1);
    }

    await refreshBadge(persistedCapture.tabId);

    // Stream to bridge in real-time
    bridgeSend('capture', {
      id: persistedCapture.id,
      method: persistedCapture.method,
      url: persistedCapture.url,
      domain: persistedCapture.domain,
      status: persistedCapture.responseStatus,
      duration: persistedCapture.duration,
      source: persistedCapture.source,
      trigger: persistedCapture.trigger,
      timestamp: persistedCapture.timestamp,
      tabUrl: persistedCapture.tabUrl,
    });
  } catch (err) {
    console.error('[Neo] persistCapture failed:', err);
  }
}

console.log(NEO_CAPTURE_MESSAGE_TYPE);
