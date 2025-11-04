/**
 * 技能执行引擎
 * 在沙箱环境中执行技能代码
 * 
 * 注意：浏览器环境中无法使用 VM2，这里使用安全的执行方式
 */

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
  retryCount?: number; // 重试次数
  retryAttempts?: Array<{ attempt: number; error: string; duration: number }>; // 重试记录
}

/**
 * 重试配置选项
 */
export interface RetryConfig {
  maxRetries?: number; // 最大重试次数，默认 3
  retryDelay?: number; // 初始重试延迟（毫秒），默认 1000
  maxRetryDelay?: number; // 最大重试延迟（毫秒），默认 10000
  backoffStrategy?: 'exponential' | 'linear' | 'fixed'; // 退避策略，默认 'exponential'
  retryableErrors?: string[]; // 可重试的错误类型，默认重试所有错误
  retryableStatusCodes?: number[]; // 可重试的 HTTP 状态码，默认 5xx 和网络错误
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  backoffStrategy: 'exponential',
  retryableErrors: [],
  retryableStatusCodes: [500, 502, 503, 504],
};

/**
 * 判断错误是否可重试
 */
function isRetryableError(error: any, config: Required<RetryConfig>): boolean {
  // 如果是 HTTP 响应错误，检查状态码
  if (error?.status) {
    return config.retryableStatusCodes.includes(error.status);
  }
  
  // 如果是网络错误（如 TypeError: Failed to fetch），通常可重试
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // 如果指定了可重试的错误类型，检查错误消息
  if (config.retryableErrors.length > 0) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return config.retryableErrors.some(pattern => errorMessage.includes(pattern));
  }
  
  // 默认重试所有错误
  return true;
}

/**
 * 计算重试延迟时间
 */
function calculateRetryDelay(attempt: number, config: Required<RetryConfig>): number {
  let delay: number;
  
  switch (config.backoffStrategy) {
    case 'exponential':
      delay = config.retryDelay * Math.pow(2, attempt);
      break;
    case 'linear':
      delay = config.retryDelay * (attempt + 1);
      break;
    case 'fixed':
      delay = config.retryDelay;
      break;
    default:
      delay = config.retryDelay * Math.pow(2, attempt);
  }
  
  return Math.min(delay, config.maxRetryDelay);
}

/**
 * 创建技能执行上下文
 */
function createSkillContext(
  domain: string,
  onApiCall: (options: ApiCallOptions) => Promise<any>,
  onStepComplete: (step: ExecutionStep) => void,
  retryConfig: Required<RetryConfig>
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
          retryCount: 0,
          retryAttempts: [],
        };
        
        let lastError: any = null;
        let retryCount = 0;
        
        // 重试逻辑
        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
          const attemptStartTime = Date.now();
          try {
            const result = await onApiCall(options);
            
            // 成功执行
            step.duration = Date.now() - startTime;
            step.responseData = result;
            step.status = 'success';
            step.retryCount = retryCount;
            onStepComplete(step);
            return result;
          } catch (error) {
            lastError = error;
            const attemptDuration = Date.now() - attemptStartTime;
            
            // 记录重试尝试（第一次失败不记录，因为还没有重试）
            if (attempt > 0) {
              if (!step.retryAttempts) {
                step.retryAttempts = [];
              }
              step.retryAttempts.push({
                attempt,
                error: error instanceof Error ? error.message : String(error),
                duration: attemptDuration,
              });
            }
            
            // 判断是否应该重试
            const shouldRetry = attempt < retryConfig.maxRetries && 
                                isRetryableError(error, retryConfig);
            
            if (!shouldRetry) {
              // 不再重试，记录最终失败
              step.duration = Date.now() - startTime;
              step.error = error instanceof Error ? error.message : String(error);
              step.status = 'failed';
              step.retryCount = retryCount;
              onStepComplete(step);
              throw error;
            }
            
            // 等待后重试
            retryCount++;
            const delay = calculateRetryDelay(attempt, retryConfig);
            console.warn(
              `[Neo] API call failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
              `retrying in ${delay}ms...`,
              error
            );
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // 所有重试都失败了
        step.duration = Date.now() - startTime;
        step.error = lastError instanceof Error ? lastError.message : String(lastError);
        step.status = 'failed';
        step.retryCount = retryCount;
        onStepComplete(step);
        throw lastError || new Error('Failed after retries');
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
 */
export async function executeSkill(
  skillCode: string,
  domain: string,
  onApiCall: (options: ApiCallOptions) => Promise<any>,
  onStepComplete?: (step: ExecutionStep) => void,
  retryConfig?: RetryConfig
): Promise<ExecutionResult> {
  const steps: ExecutionStep[] = [];
  let stepOrder = 0;
  
  // 合并重试配置
  const finalRetryConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };
  
  const onStep = (step: ExecutionStep) => {
    step.order = stepOrder++;
    steps.push(step);
    if (onStepComplete) {
      onStepComplete(step);
    }
  };
  
  const context = createSkillContext(domain, onApiCall, onStep, finalRetryConfig);
  
  try {
    // 在浏览器环境中，使用 Function 构造函数创建执行函数
    // 这是一个简化的方案，实际生产环境应该使用更安全的沙箱方案
    const executeFunction = new Function(
      'context',
      `
      ${skillCode}
      return execute(context);
    `
    );
    
    // 设置超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), 30000);
    });
    
    // 调用 execute 函数
    const result = await Promise.race([
      executeFunction(context),
      timeoutPromise,
    ]) as any;
    
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
  const response = await fetch(options.url, {
    method: options.method,
    headers: options.headers || {},
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  // 检查 HTTP 状态码，非 2xx 响应视为错误
  if (!response.ok) {
    const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

