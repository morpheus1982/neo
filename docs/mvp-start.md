# Neo MVP 启动指南

这是一个可以快速运行的 MVP 示例，帮助您快速体验 Neo 的核心功能。

## 前置要求

1. **Node.js** >= 18
2. **PostgreSQL** >= 14（或使用 Docker）
3. **Chrome 浏览器**（用于加载插件）

## 快速启动步骤

### 1. 启动数据库（使用 Docker）

```bash
# 启动 PostgreSQL
docker-compose up -d

# 或手动启动 PostgreSQL，确保数据库运行在 localhost:5432
```

### 2. 设置后端

```bash
cd neo-backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neo?schema=public"

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate

# 启动后端服务（开发模式）
npm run dev
```

后端服务将在 `http://localhost:3000` 启动。

### 3. 构建和加载插件

```bash
cd neo-extension

# 安装依赖
npm install

# 构建插件
npm run build

# 在 Chrome 中加载插件：
# 1. 打开 Chrome，访问 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 neo-extension/dist 目录
```

**注意**：首次加载前需要创建图标文件（见下方说明）

### 4. 创建插件图标

由于图标文件是二进制文件，您需要创建以下文件：

- `neo-extension/src/icons/icon16.png` (16x16 像素)
- `neo-extension/src/icons/icon48.png` (48x48 像素)
- `neo-extension/src/icons/icon128.png` (128x128 像素)

**快速创建占位图标的方法**：

1. 使用在线工具生成：https://www.favicon-generator.org/
2. 或使用 ImageMagick：
   ```bash
   # 创建一个简单的占位图标
   convert -size 16x16 xc:#4A90E2 neo-extension/src/icons/icon16.png
   convert -size 48x48 xc:#4A90E2 neo-extension/src/icons/icon48.png
   convert -size 128x128 xc:#4A90E2 neo-extension/src/icons/icon128.png
   ```

3. 或使用 Python PIL：
   ```python
   from PIL import Image
   sizes = [16, 48, 128]
   for size in sizes:
       img = Image.new('RGB', (size, size), color='#4A90E2')
       img.save(f'neo-extension/src/icons/icon{size}.png')
   ```

## MVP 使用示例

### 示例 1：测试 API 捕获

1. 加载插件后，访问任意网站（如 https://example.com）
2. 打开浏览器控制台（F12）
3. 查看是否有 Neo 相关的日志输出
4. 插件会自动捕获页面中的 API 调用并上报到后端

### 示例 2：测试 API 文档生成

```bash
# 使用 curl 触发 API 文档分析
curl -X POST http://localhost:3000/api/docs/analyze-pending \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

### 示例 3：创建技能

```bash
# 先获取一些 API 文档 ID
curl http://localhost:3000/api/docs | jq '.data[0:3] | .[].id'

# 使用获取的 ID 创建技能
curl -X POST http://localhost:3000/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "apiDocIds": ["api-doc-id-1", "api-doc-id-2"],
    "name": "示例技能",
    "description": "这是一个示例技能"
  }'
```

### 示例 4：查看技能列表

```bash
curl http://localhost:3000/api/skills?domain=example.com
```

## 验证 MVP 是否正常运行

### 1. 检查后端服务

```bash
curl http://localhost:3000/health
```

应该返回：`{"status":"ok","timestamp":"..."}`

### 2. 检查数据库连接

```bash
cd neo-backend
npm run prisma:studio
```

打开 Prisma Studio，应该能看到数据库表结构。

### 3. 检查插件

- 在 Chrome 扩展管理页面，确认插件已加载
- 访问任意网站，查看控制台是否有 Neo 相关日志
- 检查 Network 标签，确认有请求发送到 `http://localhost:3000/api/capture`

## 常见问题

### 问题 1：插件无法加载

**原因**：缺少图标文件

**解决**：创建图标文件（见上方说明）

### 问题 2：后端无法连接数据库

**原因**：数据库未启动或连接配置错误

**解决**：
1. 确认 PostgreSQL 正在运行
2. 检查 `.env` 文件中的 `DATABASE_URL` 配置
3. 运行 `npm run prisma:migrate` 初始化数据库

### 问题 3：AI 分析失败

**原因**：API Key 无效或余额不足

**解决**：
1. 检查 `.env` 文件中的 `SILICONFLOW_API_KEY`
2. 确认 API Key 有效且有余额

## 下一步

MVP 运行成功后，您可以：

1. 浏览任意网站，让插件捕获 API 调用
2. 触发 API 文档分析，查看 AI 生成的文档
3. 创建技能，体验智能编排功能
4. 在页面上执行技能，查看执行结果

## 技术支持

如果遇到问题，请查看：
- [开发计划](./docs/plan.md) - 了解项目进度和待办事项
- [架构文档](./docs/architecture.md) - 了解系统架构

