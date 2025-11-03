// Service Worker 后台脚本
// 处理来自 content script 的消息和批量上报

console.log('[Neo] Background service worker loaded');

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'API_CAPTURE') {
    // 这里可以添加额外的处理逻辑
    console.log('[Neo] Received API capture:', message.data);
  }
  
  return true;
});

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Neo] Extension installed');
});

