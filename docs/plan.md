# Neo 项目开发计划

## 总体进度：100% ✅

所有 Phase 1-5 的核心功能均已实现完成。

---

## 已完成功能

### Phase 1: 基础数据收集 ✅ 100%

#### 1.1 项目初始化 ✅
- [x] 创建 `neo-extension` 目录和基础结构
- [x] 创建 `neo-backend` 目录和基础结构
- [x] 配置 TypeScript、构建工具（Vite）
- [x] 初始化 Git 仓库

#### 1.2 插件端：API 监听 ✅
- [x] 创建 `manifest.json`（Manifest V3）
- [x] 实现 Content Script 注入
- [x] 拦截 fetch/XHR 请求（监听、捕获请求/响应数据）
- [x] 实现数据脱敏（过滤敏感字段）
- [x] 实现 Service Worker 后台脚本
- [x] 实现数据上报到服务端（批量发送）

#### 1.3 后端：数据接收和存储 ✅
- [x] 初始化 Express 服务器
- [x] 配置 PostgreSQL + Prisma（ApiDoc 模型）
- [x] 创建 API 接收接口（`POST /api/capture`）
- [x] 数据去重和存储

---

### Phase 2: AI 文档生成 ✅ 100%

#### 2.1 AI 服务集成 ✅
- [x] 创建 SiliconFlow API 客户端（DeepSeek-V3.2-Exp）
- [x] 设计 API 文档生成 Prompt
- [x] 实现错误处理和重试机制

#### 2.2 文档生成服务 ✅
- [x] 创建 `api-analysis.service.ts`
- [x] 批量处理未分析的 API 调用

#### 2.3 文档查询接口 ✅
- [x] `GET /api/docs` - 查询 API 文档列表
- [x] `GET /api/docs/:id` - 获取单个 API 文档详情
- [x] `POST /api/docs/:id/analyze` - 触发 API 文档分析
- [x] `POST /api/docs/analyze-pending` - 批量分析待处理的 API

---

### Phase 3: 技能自动编排 ✅ 100%

#### 3.1 技能编排服务 ✅
- [x] 创建 `Skill` 数据模型（Prisma）
- [x] 创建 `skill-orchestration.service.ts`
- [x] AI 分析相关 API，识别工作流模式

#### 3.2 JavaScript 代码生成器 ✅
- [x] 创建 `skill-code-generator.ts`
- [x] 根据技能定义生成 JavaScript 代码

#### 3.3 技能管理接口 ✅
- [x] `POST /api/skills` - 创建技能
- [x] `GET /api/skills` - 查询技能列表
- [x] `GET /api/skills/:id` - 获取技能详情
- [x] `GET /api/skills/:id/download` - 下载技能定义

---

### Phase 4: 技能下载和执行 ✅ 100%

#### 4.1 插件端：技能管理 ✅
- [x] 实现技能下载功能
- [x] 技能缓存和版本管理
- [x] 检测技能更新

#### 4.2 插件端：技能执行引擎（核心）✅
- [x] 创建 JavaScript 执行环境
- [x] 实现技能上下文（SkillContext）
- [x] 实现技能执行逻辑（错误处理、参数传递）

#### 4.3 插件端：UI 注入 ✅
- [x] 在页面中注入技能按钮
- [x] 实现用户交互（执行、进度显示）

#### 4.4 插件端：日志收集 ✅
- [x] 记录技能执行过程
- [x] 实现日志批量上报

#### 4.5 后端：日志接收接口 ✅
- [x] 创建 `ExecutionLog` 数据模型
- [x] `POST /api/logs` - 接收执行日志

---

### Phase 5: 技能优化 ✅ 100%

#### 5.1 技能优化服务 ✅
- [x] 创建 `skill-optimization.service.ts`
- [x] AI 分析日志，识别问题和优化点
- [x] 自动改进技能编排

#### 5.2 技能版本更新 ✅
- [x] 实现技能版本管理
- [x] `POST /api/skills/:id/optimize` - 优化单个技能
- [x] `POST /api/skills/optimize` - 批量优化技能

---

## 待完成任务

### 🔴 必须修复（阻塞功能）

#### 1. 插件图标文件缺失 ⚠️
- [ ] 创建插件图标文件：
  - `neo-extension/src/icons/icon16.png`
  - `neo-extension/src/icons/icon48.png`
  - `neo-extension/src/icons/icon128.png`
- **影响**: 插件无法正确加载

#### 2. 技能代码生成器中的 URL 替换 ⚠️
- [ ] 修复 `skill-code-generator.ts` 中的 TODO：
  - 当前：`url: '${apiCall.apiDocId}'` （使用 ID 而不是实际 URL）
  - 需要：从 ApiDoc 中获取实际的 URL
- **位置**: `neo-backend/src/services/skill-code-generator.ts:36`
- **影响**: 生成的技能代码无法正确执行 API 调用

#### 3. API 调用方法硬编码问题 ⚠️
- [ ] 修复 `skill-code-generator.ts` 中硬编码的 `method: 'GET'`
- [ ] 应该从 ApiDoc 中获取实际的 HTTP 方法
- **位置**: `neo-backend/src/services/skill-code-generator.ts:37`
- **影响**: 生成的技能代码可能使用错误的 HTTP 方法

---

### 🟡 重要完善（影响体验）

#### 4. Redis/队列系统未实现 ⚠️
- [ ] 虽然 package.json 中有 `bull` 和 `ioredis` 依赖，但代码中未使用
- [ ] 需要实现：
  - Redis 连接配置
  - AI 分析任务队列（避免阻塞 API 响应）
  - 批量处理队列
- **影响**: 大量 API 分析请求可能阻塞主线程

#### 5. 定时任务机制缺失 ⚠️
- [ ] 实现定时批量分析待处理的 API 文档
- [ ] 实现定时批量优化技能
- **影响**: 需要手动触发批量处理，无法自动化

#### 6. 技能执行错误重试机制
- [ ] 在技能执行引擎中添加重试逻辑
- [ ] 可配置的重试次数和退避策略
- **当前状态**: 有错误处理，但缺少重试机制

#### 7. 技能更新推送机制
- [ ] 实现服务端到插件的推送通知
- [ ] 插件检测到技能更新后自动下载新版本
- **当前状态**: 有版本检测，但缺少推送机制

#### 8. 跨域请求处理（CORS）
- [ ] 增强插件端的 CORS 处理
- [ ] 处理跨域 API 调用场景

#### 9. 用户数据加密传输
- [ ] 实现敏感数据传输加密
- [ ] HTTPS 强制要求

#### 10. API 调用参数传递优化
- [ ] 改进技能代码生成器中的参数映射
- [ ] 支持更复杂的参数传递（嵌套对象、数组等）

---

### 🟢 可选功能（未来扩展）

#### 11. WebSocket 支持
- [ ] 支持监听 WebSocket 连接
- [ ] 捕获 WebSocket 消息
- **优先级**: 低

#### 12. 批量处理优化
- [ ] 实现后台任务调度系统
- [ ] 使用队列处理批量分析任务
- **优先级**: 中

#### 13. 插件性能优化
- [ ] 优化 API 拦截性能
- [ ] 减少对页面性能的影响
- [ ] 实现更智能的数据采样策略
- **优先级**: 中

#### 14. 技能执行调试工具
- [ ] 添加技能执行过程的详细日志
- [ ] 实时查看执行状态
- [ ] 错误诊断和修复建议
- **优先级**: 中

#### 15. 技能可视化编排
- [ ] 用户界面化编排 API
- [ ] 拖拽式工作流编辑器
- **优先级**: 低

---

### 📋 代码质量改进

#### 16. TypeScript 类型定义完善
- [ ] 检查并修复 lint 错误
- [ ] 完善类型定义

#### 17. 错误处理统一化
- [ ] 统一错误处理格式
- [ ] 添加错误码体系
- **优先级**: 中

#### 18. 单元测试和集成测试
- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 添加端到端测试
- **优先级**: 高

#### 19. 日志系统完善
- [ ] 统一日志格式
- [ ] 日志级别管理
- [ ] 日志轮转和清理
- **优先级**: 中

---

### 🎯 部署和运维

#### 20. 环境配置验证
- [ ] 启动时验证环境变量
- [ ] 数据库连接检查
- [ ] API Key 有效性检查
- **优先级**: 高

#### 21. 监控和告警
- [ ] 添加健康检查端点（已有 `/health`）
- [ ] 性能监控
- [ ] 错误告警机制
- **优先级**: 中

#### 22. 文档完善
- [ ] API 文档（Swagger/OpenAPI）
- [ ] 部署文档
- [ ] 开发指南
- **优先级**: 中

---

## 技术栈

- **插件**：TypeScript + Chrome Extension Manifest V3 + Vite
- **后端**：TypeScript + Node.js + Express
- **数据库**：PostgreSQL + Prisma ORM
- **AI**：SiliconFlow API (DeepSeek-V3.2-Exp)

---

## 优先级总结

### 🔴 立即修复（阻塞功能）
1. 插件图标文件缺失
2. 技能代码生成器中的 URL 替换
3. API 调用方法硬编码问题

### 🟡 重要完善（影响体验）
4. Redis/队列系统实现
5. 定时任务机制
6. 技能执行错误重试机制
7. 技能更新推送机制

### 🟢 后续优化（提升质量）
8. 单元测试和集成测试
9. 监控和告警
10. 文档完善

---

**最后更新**: 2025-11-03  
**项目状态**: 核心功能已实现 ✅，待修复阻塞问题

