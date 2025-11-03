# Neo - 智能 API 监听与分析平台

Neo 通过 AI 自动发现、理解和编排 Web API，将复杂的 API 调用转化为一键可执行的"技能"，降低技术门槛，提升生产力。

## 架构概述

- **浏览器插件**：监听 API 调用、执行技能、收集日志
- **服务端**：AI 分析 API、编排技能、优化技能
- **技能执行**：在插件端执行，保护用户认证数据安全

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- npm 或 yarn

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

## 功能特性

### Phase 1: 基础数据收集
- ✅ 插件监听页面所有 API 调用
- ✅ 自动脱敏敏感信息
- ✅ 批量上报到服务端
- ✅ 数据去重和存储

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
- ✅ 插件从服务端下载技能定义
- ✅ 插件注入技能按钮到页面
- ✅ 用户点击触发技能执行
- ✅ 插件端执行引擎：在浏览器中执行技能中的 API 调用
- ✅ 插件收集执行日志并上报

### Phase 5: 技能优化
- ✅ 服务端接收执行日志
- ✅ AI 分析日志，识别问题和优化点
- ✅ 自动改进技能编排，生成新版本
- ✅ 插件自动更新技能版本

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

更多详细文档请查看 [docs](./docs/) 目录：

- [架构设计](./docs/architecture.md) - 完整的产品架构规划
- [开发计划](./docs/plan.md) - 项目开发计划和进度跟踪

## 注意事项

- 技能执行在插件端，确保用户认证数据安全
- 技能定义格式：JavaScript（需要沙箱执行环境）
- 数据安全和隐私保护（敏感信息脱敏）
- AI 调用成本需要监控和优化
- 插件性能影响要最小化

## 许可证

MIT

