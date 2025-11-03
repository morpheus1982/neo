import { captureApiCall } from './capture';

/**
 * 拦截 fetch API
 */
const originalFetch = window.fetch;

window.fetch = async function (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const startTime = Date.now();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  
  // 捕获请求信息
  const requestHeaders: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        requestHeaders[key] = value;
      });
    } else {
      Object.assign(requestHeaders, init.headers);
    }
  }
  
  let requestBody: any = undefined;
  if (init?.body) {
    if (typeof init.body === 'string') {
      try {
        requestBody = JSON.parse(init.body);
      } catch {
        requestBody = init.body;
      }
    } else {
      requestBody = init.body;
    }
  }
  
  try {
    // 执行原始 fetch
    const response = await originalFetch(input, init);
    
    const duration = Date.now() - startTime;
    
    // 克隆响应以便读取 body
    const clonedResponse = response.clone();
    
    // 异步读取响应体
    clonedResponse.json().then((responseBody) => {
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      captureApiCall({
        url,
        method,
        requestHeaders,
        requestBody,
        responseHeaders,
        responseBody,
        statusCode: response.status,
        duration,
      });
    }).catch(() => {
      // 如果响应不是 JSON，尝试读取文本
      clonedResponse.text().then((responseText) => {
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        captureApiCall({
          url,
          method,
          requestHeaders,
          requestBody,
          responseHeaders,
          responseBody: responseText,
          statusCode: response.status,
          duration,
        });
      }).catch(() => {
        // 无法读取响应体，只记录基本信息
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        captureApiCall({
          url,
          method,
          requestHeaders,
          requestBody,
          responseHeaders,
          statusCode: response.status,
          duration,
        });
      });
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录错误
    captureApiCall({
      url,
      method,
      requestHeaders,
      requestBody,
      statusCode: 0,
      duration,
    });
    
    throw error;
  }
};

/**
 * 拦截 XMLHttpRequest
 */
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async?: boolean,
  username?: string | null,
  password?: string | null
): void {
  (this as any)._neoMethod = method;
  (this as any)._neoUrl = typeof url === 'string' ? url : url.toString();
  (this as any)._neoStartTime = Date.now();
  
  return originalXHROpen.call(this, method, url, async, username, password);
};

XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
  const xhr = this as any;
  const method = xhr._neoMethod || 'GET';
  const url = xhr._neoUrl || '';
  const startTime = xhr._neoStartTime || Date.now();
  
  // 捕获请求头
  const requestHeaders: Record<string, string> = {};
  // 注意：XHR 的请求头在 send 之前设置，我们需要在设置时捕获
  // 这里我们只记录响应头，请求头在监听中无法完全获取
  
  let requestBody: any = undefined;
  if (body) {
    if (typeof body === 'string') {
      try {
        requestBody = JSON.parse(body);
      } catch {
        requestBody = body;
      }
    } else {
      requestBody = body;
    }
  }
  
  // 监听 readyState 变化
  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState === 4) {
      const duration = Date.now() - startTime;
      
      const responseHeaders: Record<string, string> = {};
      const headers = xhr.getAllResponseHeaders();
      if (headers) {
        headers.split('\r\n').forEach((line: string) => {
          const [key, ...valueParts] = line.split(': ');
          if (key && valueParts.length > 0) {
            responseHeaders[key] = valueParts.join(': ');
          }
        });
      }
      
      let responseBody: any = undefined;
      try {
        responseBody = JSON.parse(xhr.responseText);
      } catch {
        responseBody = xhr.responseText;
      }
      
      captureApiCall({
        url,
        method,
        requestHeaders,
        requestBody,
        responseHeaders,
        responseBody,
        statusCode: xhr.status,
        duration,
      });
    }
  });
  
  return originalXHRSend.call(this, body);
};

// 页面卸载时立即上报
window.addEventListener('beforeunload', () => {
  import('./capture').then(({ flushQueue }) => {
    flushQueue();
  });
});

console.log('[Neo] Content script loaded, API interception enabled');

