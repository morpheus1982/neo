import { db } from '../db';
import { CapturedRequest } from '../types';

interface DomainSummary {
  domain: string;
  count: number;
}

const domainListEl = document.getElementById('domainList') as HTMLDivElement;
const requestListEl = document.getElementById('requestList') as HTMLDivElement;
const requestDetailEl = document.getElementById('requestDetail') as HTMLPreElement;
const requestTitleEl = document.getElementById('requestTitle') as HTMLHeadingElement;
const summaryEl = document.getElementById('summary') as HTMLSpanElement;
const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;

let activeDomain: string | null = null;
let currentCalls: CapturedRequest[] = [];

refreshBtn.addEventListener('click', () => {
  void render();
});

void render();

async function render(): Promise<void> {
  const allCalls = await db.capturedRequests.orderBy('timestamp').reverse().toArray();
  summaryEl.textContent = `共 ${allCalls.length} 条记录`;
  renderDomainList(allCalls);

  if (activeDomain) {
    await renderCallsForDomain(activeDomain);
  } else if (allCalls.length > 0) {
    const latestDomain = allCalls[0]?.domain;
    if (latestDomain) {
      activeDomain = latestDomain;
      await renderCallsForDomain(latestDomain);
    }
  } else {
    requestListEl.innerHTML = '<p style="color: #94a3b8;">先访问页面并触发接口后会显示内容</p>';
    requestDetailEl.textContent = '请选择一条 API 调用查看详情';
    requestTitleEl.textContent = 'API Calls';
    activeDomain = null;
  }
}

function renderDomainList(allCalls: CapturedRequest[]): void {
  const grouped = new Map<string, number>();

  for (const item of allCalls) {
    grouped.set(item.domain, (grouped.get(item.domain) || 0) + 1);
  }

  const domainSummaries: DomainSummary[] = Array.from(grouped.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  domainListEl.innerHTML = '';

  if (domainSummaries.length === 0) {
    domainListEl.innerHTML = '<p style="color: #94a3b8;">暂无捕获到 API</p>';
    return;
  }

  for (const item of domainSummaries) {
    const button = document.createElement('button');
    button.className = `domain-item${activeDomain === item.domain ? ' active' : ''}`;
    button.innerHTML = `<div class="domain-line"><span class="domain-name">${escapeHtml(item.domain)}</span><span class="domain-count">${item.count}</span></div>`;

    button.addEventListener('click', () => {
      activeDomain = item.domain;
      void renderCallsForDomain(item.domain);
      render();
    });

    domainListEl.appendChild(button);
  }
}

async function renderCallsForDomain(domain: string): Promise<void> {
  requestTitleEl.textContent = `API Calls · ${domain}`;

  const calls = await db.capturedRequests.where('domain').equals(domain).toArray();
  currentCalls = calls.sort((a, b) => b.timestamp - a.timestamp);

  requestListEl.innerHTML = '';

  if (currentCalls.length === 0) {
    requestListEl.innerHTML = '<p style="color: #94a3b8;">该域名暂无请求</p>';
    requestDetailEl.textContent = '请选择一条 API 调用查看详情';
    return;
  }

  for (const call of currentCalls) {
    const button = document.createElement('button');
    button.className = 'call-item';
    button.innerHTML = `
      <div>
        <strong>${escapeHtml(call.method.toUpperCase())}</strong>
        <span class="domain-count">${call.responseStatus || 0}</span>
        <span style="float:right">${formatTime(call.timestamp)}</span>
      </div>
      <div class="call-url">${escapeHtml(call.url)}</div>
    `;

    button.addEventListener('click', () => {
      requestDetailEl.textContent = JSON.stringify(formatForDisplay(call), null, 2);
      [...requestListEl.querySelectorAll('.call-item')].forEach((element) => {
        (element as HTMLButtonElement).style.background = '';
      });
      button.style.background = 'rgba(56, 189, 248, 0.2)';
    });

    requestListEl.appendChild(button);
  }

  requestDetailEl.textContent = JSON.stringify(formatForDisplay(currentCalls[0]), null, 2);
}

function formatForDisplay(call: CapturedRequest): Record<string, unknown> {
  return {
    id: call.id,
    timestamp: new Date(call.timestamp).toISOString(),
    domain: call.domain,
    method: call.method,
    url: call.url,
    source: call.source,
    durationMs: call.duration,
    status: call.responseStatus,
    tabUrl: call.tabUrl,
    tabId: call.tabId,
    trigger: call.trigger,
    requestHeaders: call.requestHeaders,
    requestBody: call.requestBody,
    responseHeaders: call.responseHeaders,
    responseBody: call.responseBody,
  };
}

function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
