/**
 * 日志收集模块
 * 收集技能执行日志并批量上报
 */

import type { ExecutionResult } from './skill-executor';

const BACKEND_URL = 'http://localhost:3000';

export interface ExecutionLog {
  skillId: string;
  skillVersion: number;
  domain: string;
  timestamp: number;
  status: 'success' | 'failed' | 'partial';
  steps: any[];
  error?: string;
}

const logQueue: ExecutionLog[] = [];
const BATCH_INTERVAL = 10000; // 10秒
const MAX_QUEUE_SIZE = 50;

let batchTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 记录执行日志
 */
export function logExecution(
  skillId: string,
  skillVersion: number,
  domain: string,
  result: ExecutionResult
): void {
  const log: ExecutionLog = {
    skillId,
    skillVersion,
    domain,
    timestamp: Date.now(),
    status: result.success ? 'success' : 'failed',
    steps: result.steps || [],
    error: result.error,
  };
  
  logQueue.push(log);
  
  // 如果队列超过最大长度，移除最旧的数据
  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue.shift();
  }
  
  // 启动定时器（如果还没启动）
  if (!batchTimer) {
    batchTimer = setInterval(() => {
      flushLogs();
    }, BATCH_INTERVAL);
  }
}

/**
 * 批量上报日志
 */
async function flushLogs(): Promise<void> {
  if (logQueue.length === 0) {
    return;
  }
  
  const logsToSend = [...logQueue];
  logQueue.length = 0;
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: logsToSend }),
    });
    
    if (!response.ok) {
      console.error('[Neo] Failed to report logs:', response.statusText);
      // 如果失败，将日志重新加入队列
      logQueue.unshift(...logsToSend);
    }
  } catch (error) {
    console.error('[Neo] Error reporting logs:', error);
    // 如果失败，将日志重新加入队列
    logQueue.unshift(...logsToSend);
  }
}

/**
 * 立即上报所有日志
 */
export async function flushLogsNow(): Promise<void> {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  
  await flushLogs();
}

// 页面卸载时立即上报
window.addEventListener('beforeunload', () => {
  flushLogsNow();
});

