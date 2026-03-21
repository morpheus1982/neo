# Neo v2 Roadmap — Browser Use CLI 对比分析与改进方向

> 基于 2026-03-21 Browser Use CLI 2.0 vs Neo 实测对比

## 背景

Neo 在实际使用中有三个反复出现的稳定性问题：
1. Agent 不知道 Neo 怎么用（CLI 路径非标准，需要 SKILL.md）
2. Chrome profile 选错，丢失认证信息
3. CDP 连不上

Browser Use CLI 2.0 作为同赛道产品，在部分问题上有更好的解法。以下是实测对比后提炼的改进方向。

---

## Neo vs Browser Use CLI — 核心差异

| 维度 | Neo (当前) | Browser Use CLI 2.0 |
|------|-----------|-------------------|
| 定位 | Web App → API 逆向发现引擎 | AI Agent 通用浏览器自动化 |
| 架构 | 无状态 CLI，每次直连 CDP | 后台 daemon + Unix socket IPC |
| 浏览器管理 | 依赖外部手动启动 Chrome | 自带 Chromium + profile 发现 |
| 核心能力 | capture → schema → API 直调 | state → click N → UI 自动化 |
| Extension | 需要 Chrome extension（核心依赖） | 零扩展依赖 |
| 认证复用 | 通过 extension 抓 auth header | 通过 Chrome profile 复用 cookie |

**本质区别**：BU 是"让 AI 像人一样操作网页"，Neo 是"把网页变成 API 让 AI 直接调用"。Neo 的 API 发现是独有能力，BU 没有。

## Browser Use CLI 的真正优势

### 1. Profile 管理是一等公民
```bash
browser-use -b real profile list
# → Default: Your Chrome (Yang.Fourier@gmail.com)
```
自动扫描系统所有 Chrome profile，列出关联邮箱。Agent 按名字选即可。

还支持 `cookies export/import`，可序列化登录态跨 session 复用。

### 2. 元素索引更紧凑
```bash
browser-use state    # → [5]<input placeholder="Search..."/>
browser-use click 5
browser-use input 3 "hello"   # 定位+填写一步完成
```
连续整数索引 vs Neo 的 `@ref` 大数字。对 token 敏感的 agent 更高效。

### 3. Daemon session 持久化
一次 `open` 后，后续命令 ~50ms。Neo 每次重连 CDP WebSocket。
10+ 步连续交互（填表、多步操作）时累积延迟差异明显。

### 4. `extract` — LLM 数据提取
```bash
browser-use extract "所有产品价格和名称"
```
用 LLM 从页面提取结构化数据，不用写选择器。

### 5. 显式等待条件
```bash
browser-use wait selector ".results-loaded"
browser-use wait text "加载完成"
```
比 sleep 更精确。

### 6. `doctor` 诊断
```bash
browser-use doctor
# ✓ package, ✓ browser, ○ api_key, ✓ cloudflared, ✓ network
```

## Browser Use CLI 的弱点（实测发现）

### Daemon 状态失效
Chrome 重启后 daemon 状态不一致，报 `SessionManager not initialized`，必须手动 `browser-use close` 清理旧 session 才能重连。

**Neo 的无状态设计在断连场景下反而更健壮** — Chrome 重启后立即恢复，无需清理。

### 无 API 发现能力
BU 只做 UI 自动化，没有 capture → schema → API replay 这条路。需要重复操作同一网站时，每次都要走 UI。

---

## Neo v2 改进清单

### P0 — 去掉 Chrome Extension 依赖

**现状**：capture 核心依赖 extension 的 fetch/XHR hook。

**方案**：用 CDP `Network.enable` 替代。已验证可行：

```
CDP Network.requestWillBeSent  → URL, method, headers, postData
CDP Network.responseReceived   → status, headers, mimeType
CDP Network.getResponseBody    → response body
```

实测在 GitHub 上抓到了完整的 GraphQL API 请求/响应（含 headers、body），跟 extension 抓到的信息一致。

**唯一损失**：DOM 触发关联（"哪个按钮触发了哪个 API"）。对 agent 不重要——agent 关心 API 本身。

**收益**：
- 上手门槛降到跟 BU 一样：`chrome --remote-debugging-port=9222` 即可
- 不再需要安装/维护 extension
- `neo inject` 可以退化为可选增强

### P0 — Profile 自动发现与管理

**现状**：手动传 `--user-data-dir`，agent 经常搞错。

**方案**：
```bash
neo profile list
# → Default: Yang.Fourier@gmail.com (Google Chrome)
# → Profile 1: work@company.com

neo profile use "Default"
# → 自动用该 profile 启动 Chrome (如果没在跑)
# → 或连接已运行的 Chrome (如果 profile 匹配)
```

实现思路：
- 扫描 `~/.config/google-chrome/*/Preferences`，解析 `account_info[0].email`
- 扫描 `~/.config/chromium/*/Preferences` (Chromium)
- 存储用户选择到 `~/.neo/config.json` 的 `defaultProfile`
- `neo doctor` 时自动检测并提示

### P0 — `neo doctor --fix` 自动修复

**现状**：doctor 只诊断，不修复。

**方案**：
```bash
neo doctor --fix
# Chrome CDP ✗ → 用默认 profile 启动 Chrome ✓
# Extension ✗ → (v2 不再需要) ✓
# CDP 端口占用 → 找到正确进程并连接 ✓
```

**这一条解决了三个稳定性问题的根源**：agent 遇到任何问题只需 `neo doctor --fix`。

### P1 — 全局命令安装

**现状**：`node ~/clawd/neo/neo.cjs`

**方案**：
- `npm install -g @4ier/neo` 或在 package.json 加 `bin` 字段
- 全局命令 `neo`
- SKILL.md 里的路径简化为 `neo`

### P1 — Cookie 管理

```bash
neo cookies list github.com
neo cookies export github.com > gh-cookies.json
neo cookies import gh-cookies.json
neo cookies clear github.com
```

用 CDP `Network.getCookies` / `Network.setCookie` 实现。

### P1 — 显式等待

```bash
neo wait --selector ".results"      # 等待 CSS 选择器出现
neo wait --text "加载完成"           # 等待文本出现
neo wait --network-idle              # 等待网络空闲
neo wait 3000                        # 等待 ms (已有)
```

### P2 — 元素索引紧凑化

**现状**：`@ref` 是动态大数字（如 @1447）。

**方案**：对 `neo snapshot` 的输出做连续整数重映射：
```
[0] <button> Sign in
[1] <input placeholder="Search...">
[2] <a> Issues
```
保持 `@ref` 兼容，但输出更紧凑、token 更少。

### P2 — CDP Capture 增强

既然 capture 层迁移到 CDP，可以顺便加几个 extension 做不到的能力：
- **WebSocket 帧捕获**：`Network.webSocketFrameSent/Received`
- **请求拦截/修改**：`Fetch.requestPaused` + `Fetch.continueRequest`
- **性能指标**：`Performance.getMetrics`

### 不做的事

- **Cloud 模式**：Neo 定位纯本地，不做远程执行
- **Daemon 架构**：无状态设计在断连恢复上更优，保持当前架构
- **自带 Chromium**：依赖用户已有的 Chrome，不额外安装浏览器

---

## 改进后的架构

```
Neo v1 (当前):
  Chrome Extension (capture) → IndexedDB → neo CLI (read)
  Chrome CDP (UI automation) → neo CLI (snapshot/click/fill)

Neo v2 (目标):
  Chrome CDP Network domain (capture) → local JSON store → neo CLI
  Chrome CDP (UI automation) → neo CLI (snapshot/click/fill)
  Chrome Profile scanner → auto-connect → neo CLI
  neo doctor --fix → 自动启动/恢复 Chrome
```

去掉 extension 后，Neo 的整个数据流都走 CDP，架构更简洁、依赖更少、稳定性更高。

## 核心竞争力（不变）

Neo 的独有价值是 **API 发现 → schema 缓存 → 直接调用**。

BU 做 10 次同一个操作 = 10 次 UI 自动化。
Neo 做 10 次同一个操作 = 1 次 UI 触发 capture + 9 次 API 直调。

这个优势在 v2 不变，反而因为去掉 extension 依赖变得更易用。
