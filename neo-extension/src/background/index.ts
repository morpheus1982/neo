// Service Worker 后台脚本
// 处理来自 content script 的消息和批量上报

import { setupUpdateChecker } from './skill-update-checker';

console.log('[Neo] Background service worker loaded');

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'API_CAPTURE') {
    // 这里可以添加额外的处理逻辑
    console.log('[Neo] Received API capture:', message.data);
  }
  
  if (message.type === 'SKILL_UPDATED') {
    // 处理技能更新通知（可以在这里添加通知逻辑）
    console.log('[Neo] Skill updated:', message.data);
  }
  
  if (message.type === 'EXECUTE_SKILL') {
    // 处理技能执行请求
    const { executionId, skillCode } = message.data;
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      sendResponse({ error: 'No tab ID' });
      return false;
    }
    
    // 在background script中构建完整的执行代码（这里不受CSP限制）
    const fullCode = buildSkillExecutionCode(executionId, skillCode);
    
    // 使用chrome.scripting.executeScript执行代码
    // 传递固定的executeSkillCode函数和代码字符串作为参数
    // 在isolated world中，Function构造函数应该不受页面CSP限制
    chrome.scripting.executeScript({
      target: { tabId },
      func: executeSkillCode,
      args: [fullCode],
    }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('[Neo] Error executing skill:', error);
      sendResponse({ error: error.message });
    });
    
    return true; // 保持消息通道开放以发送异步响应
  }
  
  return true;
});

/**
 * 固定的执行函数
 * 这个函数会被注入到isolated world中执行
 * 它接受代码字符串，然后使用Function构造函数创建并执行函数
 * 注意：在isolated world中，Function构造函数应该不受页面CSP限制
 */
function executeSkillCode(codeString: string): void {
  // 使用Function构造函数创建函数并立即执行
  // 在isolated world中，Function构造函数不受页面CSP限制
  const func = new Function(codeString);
  func();
}

/**
 * 构建技能执行代码字符串
 * 在background script中构建（不受CSP限制），然后注入到页面执行
 */
function buildSkillExecutionCode(executionId: string, skillCode: string): string {
  // 转义skillCode中的特殊字符，防止代码注入
  // 由于我们在模板字符串中使用，需要转义反引号和${}
  const escapedSkillCode = skillCode
    .replace(/\\/g, '\\\\')  // 转义反斜杠
    .replace(/`/g, '\\`')    // 转义反引号
    .replace(/\${/g, '\\${'); // 转义模板字符串插值
  
  return `
    (function() {
      const executionId = ${JSON.stringify(executionId)};
      let requestIdCounter = 0;
      const state = {};
      const pendingRequests = new Map();
      
      // 创建context proxy
      const context = {
        api: {
          call: function(options) {
            return new Promise(function(resolve, reject) {
              const requestId = 'req_' + (++requestIdCounter);
              pendingRequests.set(requestId, { resolve, reject });
              
              window.postMessage({
                type: 'neo-api-call',
                executionId: executionId,
                requestId: requestId,
                options: options
              }, '*');
              
              setTimeout(function() {
                if (pendingRequests.has(requestId)) {
                  pendingRequests.delete(requestId);
                  reject(new Error('API call timeout'));
                }
              }, 30000);
            });
          }
        },
        state: {
          get: function(key) {
            return state[key];
          },
          set: function(key, value) {
            state[key] = value;
          }
        },
        storage: {
          get: function(key) {
            return new Promise(function(resolve, reject) {
              const requestId = 'storage_' + (++requestIdCounter);
              const timeout = setTimeout(function() {
                if (pendingRequests.has(requestId)) {
                  pendingRequests.delete(requestId);
                  reject(new Error('Storage get timeout'));
                }
              }, 5000);
              
              pendingRequests.set(requestId, {
                resolve: function(value) {
                  clearTimeout(timeout);
                  resolve(value);
                },
                reject: function(error) {
                  clearTimeout(timeout);
                  reject(error);
                }
              });
              
              window.postMessage({
                type: 'neo-storage-get',
                executionId: executionId,
                requestId: requestId,
                key: key
              }, '*');
            });
          },
          set: function(key, value) {
            return new Promise(function(resolve, reject) {
              const requestId = 'storage_' + (++requestIdCounter);
              const timeout = setTimeout(function() {
                if (pendingRequests.has(requestId)) {
                  pendingRequests.delete(requestId);
                  reject(new Error('Storage set timeout'));
                }
              }, 5000);
              
              pendingRequests.set(requestId, {
                resolve: function() {
                  clearTimeout(timeout);
                  resolve(undefined);
                },
                reject: function(error) {
                  clearTimeout(timeout);
                  reject(error);
                }
              });
              
              window.postMessage({
                type: 'neo-storage-set',
                executionId: executionId,
                requestId: requestId,
                key: key,
                value: value
              }, '*');
            });
          }
        }
      };
      
      // 监听API和Storage响应
      const apiResponseHandler = function(event) {
        if (event.data && event.data.executionId === executionId) {
          if (event.data.type === 'neo-api-response' || event.data.type === 'neo-storage-response') {
            const { requestId, result, error } = event.data;
            const pending = pendingRequests.get(requestId);
            if (pending) {
              pendingRequests.delete(requestId);
              if (error) {
                pending.reject(new Error(error));
              } else {
                pending.resolve(result);
              }
            }
          }
        }
      };
      window.addEventListener('message', apiResponseHandler);
      
      try {
        // 直接执行技能代码 - 将技能代码作为函数体嵌入
        // 在isolated world中，直接执行代码不受CSP限制
        ${escapedSkillCode}
        
        // 调用execute函数
        const result = execute(context);
        
        Promise.resolve(result).then(function(finalResult) {
          window.removeEventListener('message', apiResponseHandler);
          window.postMessage({
            type: 'neo-skill-result',
            executionId: executionId,
            result: finalResult
          }, '*');
        }).catch(function(error) {
          window.removeEventListener('message', apiResponseHandler);
          window.postMessage({
            type: 'neo-skill-result',
            executionId: executionId,
            error: error.message || String(error)
          }, '*');
        });
      } catch (error) {
        window.removeEventListener('message', apiResponseHandler);
        window.postMessage({
          type: 'neo-skill-result',
          executionId: executionId,
          error: error.message || String(error)
        }, '*');
      }
    })();
  `;
}

/**
 * 在页面上下文中执行的函数（已废弃，改用buildSkillExecutionCode）
 * @deprecated 使用buildSkillExecutionCode代替
 */
function executeSkillInPage(executionId: string, skillCode: string) {
  // 这个函数会在页面上下文中执行
  // 创建context proxy，通过postMessage与content script通信
  const requestIdCounter = { value: 0 };
  const state: Record<string, any> = {};
  const pendingRequests = new Map();
  
  // 创建context proxy
  const context = {
    api: {
      call: function(options: any) {
        return new Promise(function(resolve, reject) {
          const requestId = 'req_' + (++requestIdCounter.value);
          pendingRequests.set(requestId, { resolve, reject });
          
          window.postMessage({
            type: 'neo-api-call',
            executionId: executionId,
            requestId: requestId,
            options: options
          }, '*');
          
          // 设置超时
          setTimeout(function() {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('API call timeout'));
            }
          }, 30000);
        });
      }
    },
    state: {
      get: function(key: string) {
        return state[key];
      },
      set: function(key: string, value: any) {
        state[key] = value;
      }
    },
    storage: {
      get: function(key: string) {
        return new Promise(function(resolve, reject) {
          const requestId = 'storage_' + (++requestIdCounter.value);
          const timeout = setTimeout(function() {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('Storage get timeout'));
            }
          }, 5000);
          
          pendingRequests.set(requestId, {
            resolve: function(value: any) {
              clearTimeout(timeout);
              resolve(value);
            },
            reject: function(error: Error) {
              clearTimeout(timeout);
              reject(error);
            }
          });
          
          window.postMessage({
            type: 'neo-storage-get',
            executionId: executionId,
            requestId: requestId,
            key: key
          }, '*');
        });
      },
      set: function(key: string, value: any) {
        return new Promise(function(resolve, reject) {
          const requestId = 'storage_' + (++requestIdCounter.value);
          const timeout = setTimeout(function() {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('Storage set timeout'));
            }
          }, 5000);
          
          pendingRequests.set(requestId, {
            resolve: function() {
              clearTimeout(timeout);
              resolve(undefined);
            },
            reject: function(error: Error) {
              clearTimeout(timeout);
              reject(error);
            }
          });
          
          window.postMessage({
            type: 'neo-storage-set',
            executionId: executionId,
            requestId: requestId,
            key: key,
            value: value
          }, '*');
        });
      }
    }
  };
  
  // 监听API和Storage响应
  const apiResponseHandler = function(event: MessageEvent) {
    if (event.data && event.data.executionId === executionId) {
      if (event.data.type === 'neo-api-response' || event.data.type === 'neo-storage-response') {
        const { requestId, result, error } = event.data;
        const pending = pendingRequests.get(requestId);
        if (pending) {
          pendingRequests.delete(requestId);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        }
      }
    }
  };
  window.addEventListener('message', apiResponseHandler);
  
  try {
    // 执行技能代码
    // 使用Function构造函数创建execute函数（在页面上下文中，不受CSP限制）
    const executeFunction = new Function('context', `
      ${skillCode}
      return execute(context);
    `);
    
    // 调用execute函数
    const result = executeFunction(context);
    
    // 处理Promise结果
    Promise.resolve(result).then(function(finalResult: any) {
      window.removeEventListener('message', apiResponseHandler);
      window.postMessage({
        type: 'neo-skill-result',
        executionId: executionId,
        result: finalResult
      }, '*');
    }).catch(function(error: Error) {
      window.removeEventListener('message', apiResponseHandler);
      window.postMessage({
        type: 'neo-skill-result',
        executionId: executionId,
        error: error.message || String(error)
      }, '*');
    });
  } catch (error: any) {
    window.removeEventListener('message', apiResponseHandler);
    window.postMessage({
      type: 'neo-skill-result',
      executionId: executionId,
      error: error.message || String(error)
    }, '*');
  }
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Neo] Extension installed/updated:', details.reason);
  
  // 设置技能更新检查器
  setupUpdateChecker();
});

// Service Worker 启动时也设置更新检查器
setupUpdateChecker();

