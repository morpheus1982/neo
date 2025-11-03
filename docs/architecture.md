# Neo 产品架构规划

## 产品愿景
Neo 通过 AI 自动发现、理解和编排 Web API，将复杂的 API 调用转化为一键可执行的"技能"，降低技术门槛，提升生产力。技能在浏览器端执行，确保用户数据安全。

## 核心架构

### 1. 浏览器插件层（Extension）
**职责**：监听、捕获、上报 API 调用；下载和执行技能；收集执行日志

**技术栈**：
- Chrome Extension Manifest V3
- Content Scripts（注入到页面）
- Service Worker（后台脚本）
- Web Request API（拦截网络请求）

**核心功能**：
- **API 监听**：
  - 监听 fetch/XHR 请求
  - 捕获请求头、URL、方法、请求体
  - 捕获响应头、状态码、响应体
  - **上下文信息**：记录 API 调用时的页面 URL、调用时序、前后关联关系
  - 数据脱敏处理（过滤敏感信息）
  - 上报到服务端（包含上下文信息）
- **技能管理**：
  - 从服务端下载技能定义（JavaScript）
  - 技能缓存和版本管理
  - 检测技能更新
- **技能执行**（**核心功能**）：
  - 解析技能定义（JavaScript）
  - 在页面中注入技能按钮
  - 执行技能中的 API 调用序列
  - 处理参数传递和依赖关系
  - 错误处理和重试机制
  - 使用页面的认证 token（cookie、localStorage 等）
- **日志收集**：
  - 记录技能执行过程
  - 收集每个 API 调用的详细信息
  - 批量上报日志到服务端

### 2. 服务端层（Backend）
**职责**：接收数据、AI 分析、技能编排、技能优化

**技术栈**：
- Node.js + Express / Python + FastAPI
- PostgreSQL / MongoDB（存储 API 文档、技能定义）
- Redis（缓存、队列）

**核心功能模块**：

#### 2.1 API 分析服务（增强版：AI 学习 API）
- 接收插件上报的 API 调用数据（包含上下文信息）
- 调用 AI 模型深入学习 API：
  - **业务语义理解**：结合上下文和调用模式，理解 API 的业务用途和实际场景
  - **使用模式识别**：识别 API 的常见使用模式、最佳实践和反模式
  - **上下文关联**：理解 API 调用时的页面状态、调用时序、前后关系
  - **API 关系学习**：学习 API 之间的依赖关系、调用顺序、数据流转
  - **学习如何使用 API**：理解参数的含义、如何组合使用、常见错误和解决方案
  - 推断 API 用途和语义
  - 识别请求参数结构（包括必填、可选、默认值、验证规则、业务含义）
  - 识别响应数据结构（包括字段含义、数据类型、业务含义）
  - 生成 Markdown 格式的 API 文档（包含使用示例、最佳实践、常见用法）
- 存储 API 文档到数据库（包含上下文信息）

#### 2.2 技能编排服务（增强版：智能编排）
- AI 分析 API 之间的关联性和业务逻辑
- 智能编排技能（API 组合）：
  - **上下文感知编排**：基于 API 调用上下文和时序，识别真实的工作流模式
  - **迭代式编排**：支持循环、迭代、条件判断等复杂流程（如不断迭代搜索、推荐）
  - **业务逻辑理解**：理解业务流程，生成符合业务逻辑的技能编排
  - 识别常见工作流模式（线性、分支、循环、迭代）
  - 生成技能描述和名称（基于业务语义）
  - 定义技能执行顺序和参数传递（支持复杂的数据流转）
  - **增强功能生成**：将简单的 API 调用组合成高级业务功能（如"一键批量推荐"）
- 生成技能定义代码（JavaScript），支持复杂控制流
- 技能版本管理和自动优化

#### 2.3 技能分发服务
- 提供技能下载接口（JavaScript 格式）
- 按域名（domain）组织技能列表
- 技能版本管理
- 技能更新推送机制

#### 2.4 技能优化服务
- 接收插件上报的执行日志
- AI 分析日志，识别执行问题和优化点
- 自动改进技能编排
- 生成新版本技能定义

### 3. AI 模型集成层
**职责**：与 AI 大模型交互

**核心功能**：
- API 文档生成 Prompt 设计
- 技能编排 Prompt 设计
- 技能优化 Prompt 设计（基于执行日志）
- 响应解析和结构化
- 错误处理和重试机制

## MVP 功能范围

### Phase 1: 基础数据收集
- ✅ 插件监听页面所有 API 调用
- ✅ 上报请求/响应数据到服务端
- ✅ 数据存储和去重

### Phase 2: AI 文档生成
- ✅ AI 分析 API 调用，生成 Markdown 文档
- ✅ 文档包含：用途、参数说明、响应格式、示例
- ✅ 文档存储和查询接口

### Phase 3: 技能自动编排
- ✅ AI 识别相关 API，自动编排技能
- ✅ 技能定义：名称、描述、API 执行顺序
- ✅ 生成技能定义代码（JavaScript）
- ✅ 技能列表查询接口

### Phase 4: 技能下载和执行
- ✅ 插件从服务端下载技能定义（JavaScript）
- ✅ 插件注入技能按钮到页面
- ✅ 用户点击触发技能执行
- ✅ **插件端执行引擎**：在浏览器中执行技能中的 API 调用
- ✅ 插件收集执行日志（成功/失败、参数、响应等）
- ✅ 执行日志上报到服务端

### Phase 5: 技能优化
- ✅ 服务端接收执行日志
- ✅ AI 分析日志，识别问题和优化点
- ✅ 自动改进技能编排，生成新版本
- ✅ 插件自动更新技能版本

## 数据模型设计

### API 文档模型
```typescript
interface ApiDoc {
  id: string;
  url: string;
  method: string;
  domain: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseHeaders: Record<string, string>;
  responseBody?: any;
  docMarkdown: string;  // AI 生成的文档
  // 上下文信息
  context?: {
    pageUrl?: string;           // 调用时的页面 URL
    timestamp?: number;         // 调用时间戳
    sequenceOrder?: number;     // 在同一会话中的调用顺序
    previousApiId?: string;     // 前置 API 的 ID
    relatedApiIds?: string[];  // 相关的 API IDs
  };
  // AI 学习结果
  usagePatterns?: string[];     // 使用模式
  commonMistakes?: string[];    // 常见错误
  bestPractices?: string[];     // 最佳实践
  createdAt: Date;
  updatedAt: Date;
}
```

### 技能模型
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  domain: string;          // 适用的域名
  version: number;         // 版本号
  definition: SkillDefinition;  // 技能定义（JavaScript）
  createdAt: Date;
  updatedAt: Date;
}

interface SkillDefinition {
  format: 'javascript';  // 定义格式：JavaScript
  content: string;       // JavaScript 代码
  apiSequence: ApiCall[]; // API 调用序列（用于展示）
}

interface ApiCall {
  apiDocId: string;
  order: number;
  inputMapping?: Record<string, string>;  // 参数映射规则
  outputMapping?: Record<string, string>; // 输出映射规则
  condition?: string;                      // 执行条件（可选）
  loopType?: 'for' | 'while' | 'forEach'; // 循环类型（用于迭代式编排）
  loopCondition?: string;                  // 循环条件
  maxIterations?: number;                  // 最大迭代次数（防止无限循环）
}

// 执行日志模型
interface ExecutionLog {
  skillId: string;
  skillVersion: number;
  domain: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'partial';
  steps: ExecutionStep[];
  error?: string;
}

interface ExecutionStep {
  apiCallId: string;
  order: number;
  status: 'success' | 'failed' | 'skipped';
  requestData?: any;
  responseData?: any;
  error?: string;
  duration: number;
}
```

## 技能定义格式

### 方案：JavaScript

**优点**：
- 灵活性高，可以实现复杂的业务逻辑
- 可以利用现有 JS 生态和工具
- 用户可自定义和扩展
- AI 生成代码相对容易

**安全性考虑**：
- 需要沙箱环境执行（VM2 或类似方案）
- 限制可访问的 API
- 禁止访问敏感全局对象

**JavaScript 技能定义示例**：

**示例1：批量创建任务（基础）**
```javascript
// 技能：批量创建任务
async function execute(context) {
  const { api, state } = context;
  
  // 第一步：获取项目列表
  const projects = await api.call({
    url: '/api/projects',
    method: 'GET'
  });
  
  // 第二步：为每个项目创建任务
  const results = [];
  for (const project of projects) {
    const task = await api.call({
      url: '/api/tasks',
      method: 'POST',
      body: {
        projectId: project.id,
        title: '新任务',
        description: '自动创建的任务'
      }
    });
    results.push(task);
  }
  
  return {
    success: true,
    createdTasks: results.length,
    tasks: results
  };
}

export const skillMeta = {
  name: '批量创建任务',
  description: '为所有项目创建新任务',
  version: '1.0.0'
};
```

**示例2：迭代式搜索推荐（增强功能）**
```javascript
// 技能：不断迭代搜索并推荐人才（类似油猴脚本的复杂流程）
async function execute(context) {
  const { api, state } = context;
  
  const maxIterations = 50; // 最大迭代次数
  let iteration = 0;
  let hasMore = true;
  const recommended = [];
  
  // 初始化搜索参数
  state.set('searchParams', {
    page: 1,
    pageSize: 20,
    keyword: ''
  });
  
  // 迭代搜索和推荐
  while (hasMore && iteration < maxIterations) {
    iteration++;
    
    // 1. 搜索人才
    const searchParams = state.get('searchParams');
    const searchResult = await api.call({
      url: '/api/talents/search',
      method: 'POST',
      body: searchParams
    });
    
    if (!searchResult.data || searchResult.data.length === 0) {
      hasMore = false;
      break;
    }
    
    // 2. 遍历结果，推荐人才
    for (const talent of searchResult.data) {
      // 检查是否已推荐
      if (recommended.includes(talent.id)) {
        continue;
      }
      
      // 调用推荐API
      const recommendResult = await api.call({
        url: '/api/talents/recommend',
        method: 'POST',
        body: {
          talentId: talent.id,
          reason: '自动推荐'
        }
      });
      
      if (recommendResult.success) {
        recommended.push(talent.id);
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 3. 更新搜索参数，继续下一页
    if (searchResult.hasMore) {
      state.set('searchParams', {
        ...searchParams,
        page: searchParams.page + 1
      });
    } else {
      hasMore = false;
    }
  }
  
  return {
    success: true,
    iterations: iteration,
    recommendedCount: recommended.length,
    recommendedIds: recommended
  };
}

export const skillMeta = {
  name: '智能批量推荐人才',
  description: '不断迭代搜索人才库并自动推荐，直到没有更多结果',
  version: '1.0.0'
};
```

**技能执行上下文**：
```typescript
interface SkillContext {
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
```

## 技术选型建议

### 前端（插件）
- **框架**：TypeScript + Vanilla JS（轻量）
- **构建工具**：Vite / Webpack
- **UI 库**：Tailwind CSS（或原生 CSS）

### 后端
- **语言**：TypeScript + Node.js（推荐，与前端技术栈统一）
- **数据库**：PostgreSQL（关系型，适合复杂查询）
- **ORM**：Prisma

### AI 模型
- **MVP**：OpenAI GPT-4o（API 稳定，文档生成质量高）
- **未来**：支持多模型切换（Claude、开源模型）

## 关键技术挑战

1. **API 监听精度**
   - 需要准确捕获所有网络请求
   - 处理动态加载的内容
   - 处理 WebSocket 等非 HTTP 协议

2. **数据隐私安全**
   - 敏感信息脱敏（token、密码等）
   - 用户数据加密传输
   - 合规性考虑（GDPR、数据保护）

3. **AI 分析准确性**
   - Prompt 工程优化
   - 上下文理解能力
   - 处理复杂 API 场景

4. **插件端技能执行**
   - JavaScript 代码沙箱执行（安全性）
   - API 调用顺序控制
   - 错误处理和重试
   - 依赖关系处理
   - 用户认证 token 的安全处理
   - 跨域请求处理（CORS）

5. **技能优化机制**
   - 执行日志收集的完整性和准确性
   - AI 分析日志的有效性
   - 技能版本管理和更新策略
   - 增量优化 vs 全量重构

6. **性能优化**
   - 大量 API 数据的存储和查询
   - AI 调用成本控制
   - 插件性能影响最小化
   - 技能缓存的更新策略

## 未来扩展方向

1. **多种触发方式**
   - 快捷键触发
   - 语音命令
   - 定时任务
   - 条件触发（页面元素变化）

2. **技能可视化编排**
   - 用户界面化编排 API
   - 拖拽式工作流编辑器
   - 参数配置界面

3. **执行日志和调试**
   - 实时查看技能执行过程
   - 每个 API 调用的详细日志
   - 错误诊断和修复建议

4. **技能优化和改进**
   - 用户反馈收集
   - AI 自动优化技能
   - A/B 测试不同技能版本

5. **技能市场**
   - 用户分享技能
   - 技能评分和推荐
   - 社区生态建设

## 实施优先级

1. **Week 1-2**: 插件基础框架 + API 监听
2. **Week 3-4**: 服务端基础架构 + 数据接收存储
3. **Week 5-6**: AI 文档生成功能
4. **Week 7-8**: 技能编排功能 + JavaScript 代码生成器
5. **Week 9-10**: 技能下载接口 + 插件端技能执行引擎
6. **Week 11-12**: 技能按钮注入 + 技能触发处理
7. **Week 13-14**: 执行日志收集 + 日志上报接口
8. **Week 15-16**: AI 技能优化服务 + 技能版本更新机制
9. **Week 17-18**: 测试、优化、部署

## 注意事项

- MVP 阶段专注于核心功能，避免过度设计
- **技能执行在插件端，确保用户认证数据安全**
- **技能定义格式：JavaScript（需要沙箱执行环境）**
- 重点关注数据安全和隐私保护（敏感信息脱敏）
- AI 调用成本需要监控和优化
- 插件性能影响要最小化
- 考虑跨浏览器兼容性
- 技能版本管理和更新策略要设计好
- 执行日志要足够详细，便于 AI 分析优化
- JavaScript 执行需要严格的沙箱机制，防止恶意代码

