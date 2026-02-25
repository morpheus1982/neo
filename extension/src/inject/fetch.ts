/**
 * Fetch API interception.
 */

import { CapturedRequest } from '../types';
import { shouldSkipRequest } from './filter';
import { consumeTrigger } from './triggers';
import {
  generateId, toAbsoluteUrl, deriveDomain, parseHeaders,
  normalizeRequestBody, parseTextBody, emitCapture,
} from './helpers';

export function installFetchInterceptor(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const init = args[1];
    const input = args[0];
    const startedAt = Date.now();
    const startPerf = performance.now();
    const url = toAbsoluteUrl(input instanceof Request ? input.url : (input as string | URL));
    const method = ((typeof input !== 'string' && !(input instanceof URL) && init?.method)
      ? init.method
      : (input instanceof Request ? input.method : (init?.method || 'GET'))
    ).toUpperCase();
    const requestHeaders = parseHeaders(
      input instanceof Request ? input.headers : (init?.headers as Headers | Record<string, string> | undefined)
    );

    const reqHeaders = Object.keys(requestHeaders).length
      ? requestHeaders
      : init?.headers
        ? parseHeaders(init.headers as Headers | Record<string, string>)
        : {};

    if (shouldSkipRequest(url, reqHeaders)) {
      return originalFetch(input, init);
    }

    const requestBody = await normalizeRequestBody(
      input instanceof Request ? await input.clone().text() : init?.body
    );

    try {
      const response = await originalFetch(input, init);
      const duration = Math.max(0, Math.round(performance.now() - startPerf));
      let responseBody: unknown;

      try {
        const cloned = response.clone();
        const responseText = await cloned.text();
        responseBody = parseTextBody(responseText, response.headers.get('content-type') || undefined);
      } catch {
        responseBody = '[unreadable response body]';
      }

      const payload: CapturedRequest = {
        id: generateId(),
        timestamp: startedAt,
        domain: deriveDomain(url),
        url,
        method,
        requestHeaders: reqHeaders,
        requestBody,
        responseStatus: response.status,
        responseHeaders: parseHeaders(response.headers),
        responseBody,
        duration,
        trigger: consumeTrigger(),
        tabId: -1,
        tabUrl: location.href,
        source: 'fetch',
      };

      emitCapture(payload);
      return response;
    } catch (error) {
      const duration = Math.max(0, Math.round(performance.now() - startPerf));

      const payload: CapturedRequest = {
        id: generateId(),
        timestamp: startedAt,
        domain: deriveDomain(url),
        url,
        method,
        requestHeaders: reqHeaders,
        requestBody,
        responseStatus: 0,
        responseHeaders: {},
        responseBody: (error instanceof Error ? error.message : String(error)),
        duration,
        trigger: consumeTrigger(),
        tabId: -1,
        tabUrl: location.href,
        source: 'fetch',
      };

      emitCapture(payload);
      throw error;
    }
  };
}
