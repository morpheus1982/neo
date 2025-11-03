// Content Script - 处理来自 background 的消息
import './api-interceptor';
import './ui-injector';

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_API_CALL') {
    // 在页面上下文中执行 API 调用
    const { options } = message;
    
    fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => response.text());
        sendResponse({ data, status: response.status });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    
    return true; // 保持消息通道开放
  }
  
  return false;
});

