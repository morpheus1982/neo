/**
 * DOM trigger tracking.
 * Correlates user interactions (click/submit) with API calls within a time window.
 */

import { CapturedRequest } from '../types';

const TRIGGER_WINDOW_MS = 2000;

let lastTrigger: { event: string; selector: string; text?: string; timestamp: number } | null = null;

function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return tag + cls;
}

function getElementText(el: Element): string | undefined {
  const text = (el.textContent || '').trim().slice(0, 50);
  return text || undefined;
}

export function consumeTrigger(): CapturedRequest['trigger'] | undefined {
  if (!lastTrigger) return undefined;
  if (Date.now() - lastTrigger.timestamp > TRIGGER_WINDOW_MS) {
    lastTrigger = null;
    return undefined;
  }
  // Don't null — multiple API calls can share one trigger
  return { ...lastTrigger, event: lastTrigger.event as 'click' | 'input' | 'submit' };
}

export function installTriggerTracking(): void {
  document.addEventListener('click', (e) => {
    const el = e.target as Element;
    if (!el || !el.tagName) return;
    lastTrigger = { event: 'click', selector: getSelector(el), text: getElementText(el), timestamp: Date.now() };
  }, true);

  document.addEventListener('submit', (e) => {
    const el = e.target as Element;
    if (!el) return;
    lastTrigger = { event: 'submit', selector: getSelector(el), text: undefined, timestamp: Date.now() };
  }, true);
}
