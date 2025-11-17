/**
 * 技能执行引擎
 * 在沙箱环境中执行技能代码
 * 
 * 注意：浏览器环境中无法使用 VM2，这里使用安全的执行方式
 */

import { buildUrl } from '../utils/url-builder';

export interface SkillContext {
  api: {
    call(options: ApiCallOptions): Promise<any>;
  };
  state: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
  };
}

export interface ApiCallOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | string[] | number[]>;
  path?: Record<string, string | number>;
  body?: any;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  steps?: ExecutionStep[];
}

export interface ExecutionStep {
  apiCallId: string;
  order: number;
  status: 'success' | 'failed' | 'skipped';
  requestData?: any;
  responseData?: any;
  error?: string;
  duration: number;
}

/**
 * 创建技能执行上下文
 */
function createSkillContext(
  domain: string,
  onApiCall: (options: ApiCallOptions) => Promise<any>,
  onStepComplete: (step: ExecutionStep) => void
): SkillContext {
  const state = new Map<string, any>();
  
  return {
    api: {
      async call(options: ApiCallOptions): Promise<any> {
        const startTime = Date.now();
        const step: ExecutionStep = {
          apiCallId: options.url,
          order: 0, // 将在执行时更新
          status: 'success',
          requestData: options,
          duration: 0,
        };
        
        try {
          const result = await onApiCall(options);
          step.duration = Date.now() - startTime;
          step.responseData = result;
          step.status = 'success';
          onStepComplete(step);
          return result;
        } catch (error) {
          step.duration = Date.now() - startTime;
          step.error = error instanceof Error ? error.message : String(error);
          step.status = 'failed';
          onStepComplete(step);
          throw error;
        }
      },
    },
    state: {
      get(key: string): any {
        return state.get(key);
      },
      set(key: string, value: any): void {
        state.set(key, value);
      },
    },
    storage: {
      async get(key: string): Promise<any> {
        const result = await chrome.storage.local.get([key]);
        return result[key];
      },
      async set(key: string, value: any): Promise<void> {
        await chrome.storage.local.set({ [key]: value });
      },
    },
  };
}

/**
 * 执行技能代码
 * 使用动态script标签注入到页面上下文，避免CSP限制
 * 通过postMessage在content script和页面上下文之间通信
 */
export async function executeSkill(
  skillCode: string,
  domain: string,
  onApiCall: (options: ApiCallOptions) => Promise<any>,
  onStepComplete?: (step: ExecutionStep) => void
): Promise<ExecutionResult> {
  const steps: ExecutionStep[] = [];
  let stepOrder = 0;
  
  const onStep = (step: ExecutionStep) => {
    step.order = stepOrder++;
    steps.push(step);
    if (onStepComplete) {
      onStepComplete(step);
    }
  };
  
  const context = createSkillContext(domain, onApiCall, onStep);
  
  try {
    // 创建一个唯一的执行ID
    const executionId = `neo-skill-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let timeout: NodeJS.Timeout;
    let messageHandler: (event: MessageEvent) => void;
    let executionResolve: (value: any) => void;
    let executionReject: (error: Error) => void;
    
    // 处理API调用
    const handleApiCall = async (requestId: string, options: ApiCallOptions) => {
      try {
        const result = await onApiCall(options);
        onStep({
          apiCallId: options.url,
          order: stepOrder++,
          status: 'success',
          requestData: options,
          responseData: result,
          duration: 0,
        });
        return result;
      } catch (error) {
        onStep({
          apiCallId: options.url,
          order: stepOrder++,
          status: 'failed',
          requestData: options,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
        });
        throw error;
      }
    };
    
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (messageHandler) window.removeEventListener('message', messageHandler);
    };
    
    // 创建一个Promise来等待执行结果
    const executionPromise = new Promise<any>((resolve, reject) => {
      executionResolve = resolve;
      executionReject = reject;
      
      // 设置超时
      timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Execution timeout'));
      }, 30000);
      
      // 监听来自页面上下文的消息
      messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'neo-skill-result' && event.data.executionId === executionId) {
          cleanup();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        } else if (event.data && event.data.type === 'neo-api-call' && event.data.executionId === executionId) {
          // 处理来自页面上下文的API调用请求
          handleApiCall(event.data.requestId, event.data.options)
            .then(result => {
              window.postMessage({
                type: 'neo-api-response',
                executionId,
                requestId: event.data.requestId,
                result
              }, '*');
            })
            .catch(error => {
              window.postMessage({
                type: 'neo-api-response',
                executionId,
                requestId: event.data.requestId,
                error: error.message || String(error)
              }, '*');
            });
        } else if (event.data && event.data.type === 'neo-storage-get' && event.data.executionId === executionId) {
          // 处理storage.get请求
          context.storage.get(event.data.key)
            .then(value => {
              window.postMessage({
                type: 'neo-storage-response',
                executionId,
                requestId: event.data.requestId,
                result: value
              }, '*');
            })
            .catch(error => {
              window.postMessage({
                type: 'neo-storage-response',
                executionId,
                requestId: event.data.requestId,
                error: error.message || String(error)
              }, '*');
            });
        } else if (event.data && event.data.type === 'neo-storage-set' && event.data.executionId === executionId) {
          // 处理storage.set请求
          context.storage.set(event.data.key, event.data.value)
            .then(() => {
              window.postMessage({
                type: 'neo-storage-response',
                executionId,
                requestId: event.data.requestId,
                result: null
              }, '*');
            })
            .catch(error => {
              window.postMessage({
                type: 'neo-storage-response',
                executionId,
                requestId: event.data.requestId,
                error: error.message || String(error)
              }, '*');
            });
        }
      };
      
      window.addEventListener('message', messageHandler);
    });
    
    // 通过chrome.runtime.sendMessage发送到background script执行
    chrome.runtime.sendMessage({
      type: 'EXECUTE_SKILL',
      data: {
        executionId,
        skillCode,
      },
    }, (response) => {
      if (chrome.runtime.lastError) {
        cleanup();
        if (executionReject) executionReject(new Error(chrome.runtime.lastError.message));
      } else if (response?.error) {
        cleanup();
        if (executionReject) executionReject(new Error(response.error));
      }
      // 成功时，等待页面上下文通过postMessage发送结果
    });
    
    // 等待执行结果
    const result = await executionPromise;
    
    const success = steps.every(s => s.status === 'success');
    
    return {
      success,
      result,
      steps,
    };
  } catch (error) {
    console.error('[Neo] Error executing skill:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      steps,
    };
  }
}

/**
 * 在页面上下文中执行 API 调用
 * 使用页面的认证信息（cookie、localStorage 等）
 */
export async function executeApiCallInPage(
  options: ApiCallOptions
): Promise<any> {
  // 在 content script 中直接执行，这样可以使用页面的认证信息
  try {
    // 构建完整的 URL
    const fullUrl = buildUrl(options.url, options.path, options.query);
    
    // 准备请求头
    const headers: Record<string, string> = {
      ...options.headers,
    };
    
    // 如果 body 存在且未设置 Content-Type，默认设置为 application/json
    if (options.body && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // 执行请求
    const response = await fetch(fullUrl, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API call failed: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    // 根据响应类型解析响应体
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    throw error;
  }
}

