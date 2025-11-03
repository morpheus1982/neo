// Popup 脚本
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  
  if (statusEl) {
    // 检查插件状态
    chrome.storage.local.get(['neoEnabled'], (result) => {
      const enabled = result.neoEnabled !== false;
      statusEl.textContent = enabled ? '正在监听 API 调用...' : '已暂停监听';
      statusEl.className = `status ${enabled ? 'active' : 'inactive'}`;
    });
  }
});

