/**
 * 敏感字段列表
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'auth',
  'api_key',
  'apiKey',
  'apikey',
  'secret',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'session',
  'cookie',
  'csrf',
  'csrfToken',
  'credential',
  'credentials'
];

/**
 * 敏感字段的正则表达式匹配模式
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /auth/i,
  /secret/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /csrf/i,
  /key/i
];

/**
 * 检查字段名是否敏感
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  
  // 检查精确匹配
  if (SENSITIVE_FIELDS.some(field => lowerField === field.toLowerCase())) {
    return true;
  }
  
  // 检查模式匹配
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * 脱敏处理对象
 */
function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) {
    return '[Max Depth Reached]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string' && value.length > 100) {
      // 长字符串可能包含敏感信息
      sanitized[key] = value.substring(0, 100) + '...';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 脱敏处理请求头
 */
export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 脱敏处理请求体或响应体
 */
export function sanitizeBody(body: any): any {
  if (!body) {
    return body;
  }
  
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(sanitizeObject(parsed));
    } catch {
      // 不是 JSON，检查是否包含敏感关键词
      if (body.length > 500) {
        return body.substring(0, 500) + '...';
      }
      return body;
    }
  }
  
  return sanitizeObject(body);
}

/**
 * 脱敏处理 URL（移除查询参数中的敏感信息）
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    for (const [key, value] of params.entries()) {
      if (isSensitiveField(key)) {
        params.set(key, '[REDACTED]');
      }
    }
    
    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    return url;
  }
}

