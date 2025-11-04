# Neo - 智能 API 监听与分析平台

Neo 通过 AI 自动发现、理解和编排 Web API，将复杂的 API 调用转化为一键可执行的"技能"，降低技术门槛，提升生产力。

## 架构概述

- **浏览器插件**：监听 API 调用、执行技能、收集日志
- **服务端**：AI 深入学习 API、智能编排技能、优化技能
- **技能执行**：在插件端执行，保护用户认证数据安全

## 核心特性

### 🤖 AI 学习 API
- **业务语义理解**：AI 结合上下文理解 API 的实际业务用途
- **使用模式识别**：自动识别 API 的常见使用模式、最佳实践和常见错误
- **API 关系学习**：学习 API 之间的依赖关系、调用顺序和数据流转

### 🎯 智能技能编排
- **迭代式编排**：支持循环、迭代、条件判断等复杂流程
  - 例如：不断迭代搜索人才库并自动推荐，直到没有更多结果
- **增强功能生成**：将简单的 API 调用组合成高级业务功能
  - 例如：将"搜索 API" + "推荐 API" 组合成"一键批量推荐"技能
- **上下文感知**：基于 API 调用上下文和时序，识别真实的工作流模式

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14（或使用 Docker）
- npm 或 yarn
- Docker（可选，用于快速启动数据库）

### 后端设置

1. 安装依赖：
```bash
cd neo-backend
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和 SiliconFlow API Key
# API Key 已预配置，如需修改请编辑 SILICONFLOW_API_KEY
```

3. 初始化数据库：
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. 启动服务：
```bash
npm run dev
```

### 插件开发

1. 安装依赖：
```bash
cd neo-extension
npm install
```

2. 构建插件：
```bash
npm run build
```

3. 加载插件到 Chrome：
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `neo-extension/dist` 目录

## 当前进展

### Phase 1: 基础数据收集 ✅
- ✅ 插件监听页面所有 API 调用
- ✅ 自动脱敏敏感信息
- ✅ 批量上报到服务端
- ✅ 数据去重和存储

### Phase 2: AI 文档生成 ✅
- ✅ AI 深入学习 API 调用，生成 Markdown 文档
- ✅ **业务语义理解**：理解 API 在业务场景中的实际用途
- ✅ **使用模式识别**：识别常见使用模式、最佳实践和常见错误
- ✅ **API 关系学习**：学习 API 之间的依赖关系和调用顺序
- ✅ 文档包含：用途、参数说明、响应格式、使用示例、最佳实践
- ✅ 文档存储和查询接口

### Phase 3: 技能自动编排 ✅
- ✅ AI 识别相关 API，智能编排技能
- ✅ **上下文感知编排**：基于 API 调用上下文和时序，识别真实的工作流模式
- ✅ **迭代式编排**：支持循环、迭代、条件判断等复杂流程（如不断迭代搜索、推荐）
- ✅ **增强功能生成**：将简单的 API 调用组合成高级业务功能（如"一键批量推荐"）
- ✅ 技能定义：名称、描述、API 执行顺序（支持循环和条件）
- ✅ 生成技能定义代码（JavaScript），支持复杂控制流
- ✅ 技能列表查询接口

### Phase 4: 技能下载和执行 ✅
- ✅ 插件从服务端下载技能定义
- ✅ 插件注入技能按钮到页面
- ✅ 用户点击触发技能执行
- ✅ 插件端执行引擎：在浏览器中执行技能中的 API 调用
- ✅ 插件收集执行日志并上报

### Phase 5: 技能优化 ✅
- ✅ 服务端接收执行日志
- ✅ AI 分析日志，识别问题和优化点
- ✅ 自动改进技能编排，生成新版本
- ✅ 插件自动更新技能版本

## Roadmap

### 🟡 中优先级（重要完善）

1. **Redis/队列系统实现**
   - 实现 AI 分析任务队列，避免阻塞主线程
   - 使用 Bull 和 Redis 管理异步任务

2. **定时任务机制**
   - 实现定时批量分析待处理的 API 文档
   - 实现定时批量优化技能

3. **技能执行错误重试机制**
   - 添加重试逻辑和指数退避策略
   - 可配置的重试次数

4. **技能更新推送机制**
   - 实现服务端到插件的推送通知
   - 插件自动检测并下载新版本

5. **跨域请求处理（CORS）**
   - 增强插件端的 CORS 处理
   - 处理跨域 API 调用场景

6. **用户数据加密传输**
   - 实现敏感数据传输加密
   - HTTPS 强制要求

7. **API 调用参数传递优化**
   - 支持更复杂的参数传递（嵌套对象、数组等）
   - 改进参数映射规则

### 🟢 低优先级（可选功能）

8. **WebSocket 支持** - 支持监听 WebSocket 连接和消息
9. **批量处理优化** - 实现后台任务调度系统
10. **插件性能优化** - 优化 API 拦截性能，减少对页面影响
11. **技能执行调试工具** - 添加详细日志和实时状态查看
12. **技能可视化编排** - 用户界面化编排 API，拖拽式工作流编辑器

### 📋 代码质量改进

13. **TypeScript 类型定义完善** - 检查并修复 lint 错误
14. **错误处理统一化** - 统一错误处理格式和错误码体系
15. **单元测试和集成测试** - 添加全面的测试覆盖
16. **日志系统完善** - 统一日志格式，日志级别管理

### 🎯 部署和运维

17. **环境配置验证** - 启动时验证环境变量、数据库连接和 API Key
18. **监控和告警** - 性能监控和错误告警机制
19. **文档完善** - API 文档（Swagger/OpenAPI）、部署文档和开发指南

详细的开发计划和进度请查看 [开发计划](./docs/plan.md)。

## API 端点

### 数据捕获
- `POST /api/capture` - 接收插件上报的 API 调用数据

### API 文档
- `GET /api/docs` - 查询 API 文档列表
- `GET /api/docs/:id` - 获取单个 API 文档详情
- `POST /api/docs/:id/analyze` - 触发 API 文档分析
- `POST /api/docs/analyze-pending` - 批量分析待处理的 API

### 技能管理
- `POST /api/skills` - 创建技能
- `GET /api/skills` - 查询技能列表
- `GET /api/skills/:id` - 获取技能详情
- `GET /api/skills/:id/download` - 下载技能定义（JavaScript 格式）
- `POST /api/skills/:id/optimize` - 优化单个技能
- `POST /api/skills/optimize` - 批量优化技能

### 执行日志
- `POST /api/logs` - 接收执行日志

## 技术栈

- **插件**：TypeScript + Chrome Extension Manifest V3 + Vite
- **后端**：TypeScript + Node.js + Express
- **数据库**：PostgreSQL + Prisma ORM
- **AI**：SiliconFlow API (DeepSeek-V3.2-Exp)

## 开发说明

### 项目结构

```
neo/
├── neo-extension/          # Chrome 浏览器插件
│   ├── src/
│   │   ├── content/       # Content Scripts
│   │   ├── background/     # Service Worker
│   │   ├── popup/          # 插件弹窗 UI
│   │   └── utils/          # 工具函数
│   ├── manifest.json       # Manifest V3 配置
│   └── package.json
├── neo-backend/            # 后端服务
│   ├── src/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── ai/             # AI 集成
│   │   └── utils/          # 工具函数
│   ├── prisma/             # Prisma schema
│   └── package.json
└── README.md
```

## 文档

更多详细文档请查看：

- [架构设计](./docs/architecture.md) - 完整的产品架构规划
- [开发计划](./docs/plan.md) - 项目开发计划和进度跟踪
- [启动指南](./docs/mvp-start.md) - 详细的启动和使用说明

## 注意事项

- 技能执行在插件端，确保用户认证数据安全
- 技能定义格式：JavaScript（需要沙箱执行环境）
- 数据安全和隐私保护（敏感信息脱敏）
- AI 调用成本需要监控和优化
- 插件性能影响要最小化

## 许可证

MIT

