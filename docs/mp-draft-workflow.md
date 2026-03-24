# 微信公众平台草稿自动化操作记录

> 记录时间: 2026-03-24
> 操作人: Neo 自动化测试

---

## 操作概述

通过 Neo 浏览器自动化工具，完成微信公众平台草稿创建和 API 捕获。

## 前置条件

1. **Chrome 浏览器** - 启用 CDP 调试端口
2. **Neo 扩展** - 已安装并激活
3. **微信公众平台账号** - 需要扫码登录

## 启动命令

```bash
# 启动 Chrome 和 Neo 扩展
neo start

# 或手动启动 Chrome
google-chrome-stable --remote-debugging-port=9222
```

## 操作流程

### Step 1: 环境检查

```bash
neo doctor
```

预期输出：
```
✓  Chrome CDP endpoint
✓  Browser tabs
✓  Neo extension service worker
✓  IndexedDB captures
```

### Step 2: 打开微信公众平台

```bash
neo open "https://mp.weixin.qq.com"
```

### Step 3: 登录检测

等待用户扫码登录。Neo 会检测页面是否包含"草稿箱"菜单来判断登录状态。

**登录状态检测代码：**
```javascript
// 检查是否存在"草稿箱"菜单（已登录标志）
const snapshot = await neo.snapshot();
const isLoggedIn = snapshot.includes('草稿箱');
```

### Step 4: 进入草稿编辑页

```javascript
// 方法1: 直接打开编辑页 URL（需要有效 token）
window.location.href = "/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&create_type=0&token=YOUR_TOKEN&lang=zh_CN";

// 方法2: 通过 UI 点击
// 点击"草稿箱"菜单
document.querySelector('a[href*="appmsg"]').click();
// 等待后点击"新的创作"
```

### Step 5: 填写草稿内容

**标题输入框选择器：**
```javascript
const titleInput = document.querySelector('.js_appmsg_title') ||
                   document.querySelector('[id*=appmsg_title]') ||
                   document.querySelector('#js_appmsg_title');
titleInput.value = "Test Draft - 2026-03-24";
titleInput.dispatchEvent(new Event('input', {bubbles: true}));
```

**正文编辑器（ProseMirror）：**
```javascript
const editor = document.querySelector('.ProseMirror');
editor.focus();
editor.innerHTML = '<p>This is a test draft created by Neo automation.</p><p>API capture test.</p>';
editor.dispatchEvent(new Event('input', {bubbles: true}));
```

### Step 6: 保存草稿

```javascript
// 查找并点击"保存为草稿"按钮
const saveBtn = [...document.querySelectorAll('*')].find(
  e => e.innerText === '保存为草稿' && e.clientWidth > 0
);
saveBtn.click();
```

### Step 7: 生成 API 文档

```bash
neo schema generate mp.weixin.qq.com
neo schema show mp.weixin.qq.com
```

---

## 捕获的 API 接口

### 草稿相关核心接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/cgi-bin/appmsg` | POST | 创建/编辑图文消息 |
| `/cgi-bin/operate_appmsg` | POST | 图文消息高级操作 |
| `/cgi-bin/appmsgpublish` | GET | 已发布图文列表 |
| `/cgi-bin/masssend` | POST | 群发消息操作 |

### 认证相关接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/cgi-bin/bizlogin` | POST | 业务登录 |
| `/cgi-bin/scanloginqrcode` | GET | 扫码登录状态查询 |

### 新增接口（本次捕获）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/cgi-bin/sysnotify` | POST | 系统通知 |
| `/cgi-bin/singlesendpage` | GET | 单发页面 |
| `/mp/getbizbanner` | GET | 获取业务 banner |
| `/mp/relatedsearchword` | GET | 相关搜索词 |
| `/mp/appmsg_comment` | GET/POST | 文章评论 |
| `/cgi-bin/getnewmsgnum` | POST | 获取新消息数 |
| `/mp/appmsgreport` | POST | 文章上报 |
| `/weheat-agent/payload` | POST | 热点代理 |
| `/cgi-bin/appmsg` | GET | 获取图文详情 |
| `/mp/getappmsgext` | POST | 获取文章扩展信息 |
| `/cgi-bin/singlesend` | GET | 单发消息 |
| `/cgi-bin/message` | POST | 消息接口 |
| `/mp/getappmsgad` | POST | 获取文章广告 |

---

## 完整统计

| 指标 | 数值 |
|------|------|
| 总捕获数 | 183 次 |
| 唯一接口数 | 40 个 |
| 新增接口 | 14 个 |

---

## 验证命令

```bash
# 检查捕获数量
neo capture count mp.weixin.qq.com

# 查看最近捕获
neo capture list mp.weixin.qq.com --limit 10

# 查看 schema
neo schema show mp.weixin.qq.com

# 导出 OpenAPI 格式
neo schema openapi mp.weixin.qq.com > mp-openapi.yaml
```

---

## 注意事项

1. **Token 有效期** - 微信公众平台的 token 会过期，需要重新登录获取
2. **登录态保持** - 操作过程中需要保持登录状态
3. **频率限制** - 避免高频调用，可能触发风控
4. **CORS 限制** - API 调用在浏览器上下文中执行，受同源策略保护

---

## 相关文件

- `mp-api.md` - 完整 API 文档
- `~/.neo/schemas/mp.weixin.qq.com.json` - Schema 文件
- `tools/mp-draft.sh` - 自动化脚本（已创建框架）

---

*文档生成时间: 2026-03-24*
