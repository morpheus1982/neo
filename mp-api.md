# 微信公众平台 API 文档

> 基于流量捕获自动生成
> 生成时间: 2026-03-24
> 域名: mp.weixin.qq.com
> 总捕获数: 183 次
> 唯一接口数: 40 个

---

## 目录

- [概述](#概述)
- [通用说明](#通用说明)
- [认证相关接口](#认证相关接口)
- [图文消息接口](#图文消息接口)
- [群发接口](#群发接口)
- [素材管理接口](#素材管理接口)
- [账号管理接口](#账号管理接口)
- [数据统计接口](#数据统计接口)
- [其他接口](#其他接口)

---

## 概述

本文档记录了微信公众平台 (mp.weixin.qq.com) 的内部 API 接口。这些接口通过浏览器流量捕获分析得出，用于微信公众号后台管理系统的前端与后端通信。

### 接口分类

| 类别 | 数量 | 说明 |
|------|------|------|
| 认证 (auth) | 2 | 登录、扫码登录相关 |
| 读取 (read) | 13 | 获取数据、查询类接口 |
| 写入 (write) | 11 | 创建、更新、删除类接口 |

---

## 通用说明

### 基础 URL

```
https://mp.weixin.qq.com
```

### 通用请求头

| Header | 值 | 说明 |
|--------|-----|------|
| `X-Requested-With` | `XMLHttpRequest` | 标识 AJAX 请求 |
| `Content-Type` | `application/x-www-form-urlencoded` | POST 请求体格式 |

### 通用查询参数

以下参数在大多数接口中都会出现：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | 是 | 登录凭证，从登录后获取 |
| `lang` | string | 否 | 语言，默认 `zh_CN` |
| `f` | string | 否 | 格式，通常为 `json` |
| `ajax` | string | 否 | AJAX 标识，通常为 `1` |
| `fingerprint` | string | 否 | 浏览器指纹 |
| `random` | number | 否 | 随机数，防止缓存 |

### 通用响应结构

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `base_resp.ret` | number | 返回码，0 表示成功 |
| `base_resp.err_msg` | string | 错误信息 |

---

## 认证相关接口

### 1. 业务登录

扫码登录核心接口。

**请求**

```
POST /cgi-bin/bizlogin?action={action}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型：`startlogin` 开始登录, `login` 执行登录 |

**响应**

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  }
}
```

**示例**

```bash
# 开始扫码登录
curl -X POST 'https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Cookie: {session_cookies}'

# 确认登录
curl -X POST 'https://mp.weixin.qq.com/cgi-bin/bizlogin?action=login' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Cookie: {session_cookies}'
```

---

### 2. 扫码登录状态查询

查询二维码扫码状态。

**请求**

```
GET /cgi-bin/scanloginqrcode?action=ask&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，`ask` 查询状态 |
| `fingerprint` | string | 是 | 会话指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "status": 0,
  "binduin": 1234567890,
  "acct_size": 1,
  "user_category": 0
}
```

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | number | 扫码状态：0=等待, 1=已扫码待确认, 2=已确认, 3=已取消 |
| `binduin` | number | 绑定的微信号 UIN |
| `acct_size` | number | 账号数量 |
| `user_category` | number | 用户类别 |

**平均响应时间**: 102ms

---

## 图文消息接口

### 3. 图文消息操作 (POST)

创建、编辑图文消息。

**请求**

```
POST /cgi-bin/appmsg?action={action}&appmsgid={appmsgid}&offset={offset}&limit={limit}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `appmsgid` | string | 否 | 图文消息 ID，编辑时必填 |
| `offset` | number | 否 | 偏移量 |
| `limit` | number | 否 | 返回数量限制 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "list": []
}
```

**触发场景**

- 点击 "保存为草稿" 按钮 (`span.send_wording`)

**平均响应时间**: 324ms

---

### 4. 图文消息查询 (GET)

获取图文消息列表或详情。

**请求**

```
GET /cgi-bin/operate_appmsg?t={t}&sub={sub}&token={token}&lang={lang}&f={f}&ajax={ajax}&random={random}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `t` | string | 是 | 模板类型 |
| `sub` | string | 是 | 子操作类型 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `random` | number | 否 | 随机数 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "items": [
    {
      // 图文消息内容
    }
  ]
}
```

**平均响应时间**: 445ms

---

### 5. 图文消息高级操作

图文消息的高级编辑操作。

**请求**

```
POST /cgi-bin/operate_appmsg?t={t}&sub={sub}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `t` | string | 是 | 类型，如 `ajax-response` |
| `sub` | string | 是 | 子操作，如 `pre_load_sentence` |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  }
}
```

**触发场景**

- 点击复选框 (`#checkbox13`)

**平均响应时间**: 206ms

---

### 6. 已发布图文列表

获取已发布的图文消息列表。

**请求**

```
GET /cgi-bin/appmsgpublish?sub={sub}&begin={begin}&count={count}&query={query}&type={type}&show_type={show_type}&free_publish_type={free_publish_type}&sub_action={sub_action}&search_card={search_card}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sub` | string | 是 | 子操作，如 `list` |
| `begin` | number | 是 | 起始位置 |
| `count` | number | 是 | 返回数量 |
| `query` | string | 否 | 搜索关键词 |
| `type` | string | 是 | 类型，如 `101_1` |
| `show_type` | string | 否 | 显示类型 |
| `free_publish_type` | string | 否 | 发布类型 |
| `sub_action` | string | 否 | 子动作 |
| `search_card` | string | 否 | 搜索卡片 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "is_admin": true,
  "publish_page": "..."
}
```

**平均响应时间**: 979ms

---

## 群发接口

### 7. 群发消息操作

群发消息管理。

**请求**

```
POST /cgi-bin/masssend?action={action}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "list": []
}
```

**触发场景**

- 点击 "保存为草稿" 按钮

**平均响应时间**: 121ms

---

## 素材管理接口

### 8. 模板消息列表

获取小程序模板消息列表。

**请求**

```
GET /wxamp/cgi/newtmpl/get_pritmpllist?random={random}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `random` | number | 是 | 随机数 |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "ret": 0,
  "success": true,
  "list": [],
  "__rpcCount": 0
}
```

**平均响应时间**: 586ms

---

### 9. AI 生成图片协议

查询 AI 生成图片服务协议状态。

**请求**

```
GET /cgi-bin/mpaigenpic?action={action}&token={token}&lang={lang}&f={f}&ajax={ajax}&random={random}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，如 `process_terms_of_use` |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `random` | number | 否 | 随机数 |

**响应**

```json
{
  "agree": 0,
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `agree` | number | 是否已同意协议：0=未同意, 1=已同意 |

**平均响应时间**: 481ms

---

## 账号管理接口

### 10. 切换账号

获取可切换的账号列表。

**请求**

```
GET /cgi-bin/switchacct?action={action}&token={token}&lang={lang}&f={f}&fingerprint={fingerprint}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，如 `get_acct_list` |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "biz_list": {
    "length": 1,
    "list": {},
    "order_type": 0
  },
  "order": 0,
  "scan_login_ctx": {
    "account_switch_permit": 0
  },
  "service_biz_list": {
    "length": 0,
    "list": {},
    "order_type": 0
  },
  "status": 0,
  "wxa_list": {
    "length": 0,
    "list": {},
    "order_type": 0
  },
  "wxproduct_list": {
    "length": 0,
    "list": {},
    "order_type": 0
  }
}
```

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `biz_list` | object | 公众号列表 |
| `service_biz_list` | object | 服务号列表 |
| `wxa_list` | object | 小程序列表 |
| `wxproduct_list` | object | 微信小店列表 |
| `status` | number | 状态码 |
| `scan_login_ctx.account_switch_permit` | number | 是否允许切换账号 |

**平均响应时间**: 492ms

---

### 11. 首页信息

获取首页相关信息。

**请求**

```
GET /cgi-bin/home?action={action}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，如 `get_finder_live_info` |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "biz_finder_live_info": {
    "bind_finder_status": 0
  }
}
```

**平均响应时间**: 131ms

---

### 12. 窗口商品 (GET)

查询窗口商品开通状态。

**请求**

```
GET /cgi-bin/windowproduct?action={action}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，如 `check_update_aff` |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "open_detail": {
    "agree_principal": 0,
    "agree_talent": 0,
    "already_open": 0,
    "can_update": 0,
    "is_realname": 0
  }
}
```

**平均响应时间**: 237ms

---

### 13. 窗口商品 (POST)

更新窗口商品设置。

**请求**

```
POST /cgi-bin/windowproduct?action={action}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "ext_info": ""
}
```

**平均响应时间**: 231ms

---

## 数据统计接口

### 14. 聊天权限检查

检查聊天功能权限。

**请求**

```
GET /webpoc/cgi/chat/checkChatPermission?type={type}&grayType={grayType}&token={token}&lang={lang}&f={f}&ajax={ajax}&fingerprint={fingerprint}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | number | 是 | 类型 |
| `grayType` | string | 是 | 灰度类型 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `fingerprint` | string | 是 | 浏览器指纹 |

**响应**

```json
{
  "ret": 0,
  "can": true,
  "updateTime": 1710585600000
}
```

**平均响应时间**: 132ms

---

### 15. 推广订单

获取推广订单数据。

**请求**

```
GET /cgi-bin/mppromotionorder?action={action}&data={data}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `data` | string | 是 | 查询数据 JSON |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "is_admin": 0,
  "item_list": [
    {
      // 订单数据
    }
  ]
}
```

**平均响应时间**: 850ms

---

### 16. 广告主管理

获取广告主相关信息。

**请求**

```
GET /merchant/ad_seller_manager?action={action}&token={token}&lang={lang}&f={f}&ajax={ajax}&random={random}&begin={begin}&count={count}&msg_type={msg_type}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `random` | number | 是 | 随机数 |
| `begin` | number | 是 | 起始位置 |
| `count` | number | 是 | 返回数量 |
| `msg_type` | string | 是 | 消息类型 |

**响应**

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  },
  "total_num": 0,
  "ad_info_list": [],
  "total_category_num": 0,
  "category_list": [
    {
      // 分类数据
    }
  ],
  "single_ad_info": [],
  "selected_single_ad_info": [],
  "can_use_single_ad": 0,
  "trade_group_list": []
}
```

**平均响应时间**: 695ms

---

### 17. 精选列表

获取精选内容列表。

**请求**

```
GET /cgi-bin/featuredlist?sub={sub}&token={token}&fingerprint={fingerprint}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sub` | string | 是 | 子操作 |
| `token` | string | 是 | 登录凭证 |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "item": []
}
```

**平均响应时间**: 201ms

---

## 其他接口

### 18. 前端通用存储 (GET)

前端通用数据存储服务。

**请求**

```
GET /cgi-bin/mmbizfrontendcommstore?operate_type={operate_type}&service_name={service_name}&service_option={service_option}&fingerprint={fingerprint}&token={token}&lang={lang}&f={f}&ajax={ajax}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `operate_type` | string | 是 | 操作类型，如 `GetServiceData` |
| `service_name` | string | 是 | 服务名称 |
| `service_option` | string | 是 | 服务选项 |
| `fingerprint` | string | 是 | 浏览器指纹 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |

**响应**

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  },
  "err_code": 0
}
```

**平均响应时间**: 150ms

---

### 19. 前端通用存储 (POST)

保存前端通用数据。

**请求**

```
POST /cgi-bin/mmbizfrontendcommstore
```

**响应**

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  },
  "err_code": 0
}
```

**触发场景**

- 点击 "留言和回复自动精选公开" 开关

**平均响应时间**: 111ms

---

### 20. Web 上报

前端错误/行为上报。

**请求**

```
POST /cgi-bin/webreport?action={action}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |

**响应**

```json
{
  "err_list": [
    {
      // 错误信息
    }
  ]
}
```

**触发场景**

- 点击 "草稿箱" 菜单

**平均响应时间**: 143ms

---

### 21. 公众号日志

公众号操作日志记录。

**请求**

```
POST /advanced/mplog?action={action}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  }
}
```

**平均响应时间**: 130ms

---

### 22. 诸葛 MP 智能助手

智能问答相关接口。

**请求**

```
GET /cgi-bin/zhuge_mp?action={action}&token={token}&lang={lang}&f={f}&ajax={ajax}&random={random}&count={count}&username={username}&type={type}&context_buf={context_buf}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `token` | string | 是 | 登录凭证 |
| `lang` | string | 否 | 语言 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `random` | number | 是 | 随机数 |
| `count` | number | 是 | 返回数量 |
| `username` | string | 是 | 用户名 |
| `type` | string | 是 | 类型 |
| `context_buf` | string | 否 | 上下文缓冲 |

**响应**

```json
{
  "base_resp": {
    "err_msg": "ok",
    "ret": 0
  },
  "user_question_list": {
    "context_buf": "",
    "continue_flag": 0,
    "list": {}
  }
}
```

**平均响应时间**: 481ms

---

### 23. 公告获取

获取系统公告。

**请求**

```
GET /cgi-bin/announce?action={action}&key={key}&version={version}&lang={lang}&platform={platform}&token={token}&f={f}&ajax={ajax}&random={random}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型，如 `get` |
| `key` | string | 是 | 公告键 |
| `version` | string | 是 | 版本 |
| `lang` | string | 否 | 语言 |
| `platform` | string | 否 | 平台 |
| `token` | string | 是 | 登录凭证 |
| `f` | string | 否 | 格式 |
| `ajax` | string | 否 | AJAX 标识 |
| `random` | number | 否 | 随机数 |

**响应**

```json
{
  "base_resp": {
    "ret": 0,
    "err_msg": "ok"
  },
  "getannouncement_resp": {
    "key": "announcement_key",
    "title": "公告标题",
    "content": "公告内容",
    "online_time": 1710585600,
    "author": "作者",
    "updater": "更新者",
    "status": 1
  }
}
```

**平均响应时间**: 474ms

---

### 24. Web 通信上报

Web 通信数据上报。

**请求**

```
POST /mp/webcommreport?action={action}&report_useruin={report_useruin}&__biz={__biz}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `report_useruin` | string | 是 | 上报用户 UIN |
| `__biz` | string | 是 | 公众号 biz |

**响应**

```json
{
  "base_resp": {
    "exportkey_token": "",
    "ret": 0
  }
}
```

**平均响应时间**: 132ms

---

### 25. WAP 通信上报

移动端通信数据上报。

**请求**

```
POST /mp/wapcommreport?action={action}&version={version}&x5={x5}&f={f}&user_article_role={user_article_role}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `version` | string | 否 | 版本 |
| `x5` | string | 否 | X5 内核标识 |
| `f` | string | 否 | 格式 |
| `user_article_role` | string | 否 | 用户文章角色 |

**响应**

```json
{
  "err_list": [
    {
      // 错误信息
    }
  ]
}
```

**平均响应时间**: 57ms

---

### 26. JS 监控

JavaScript 监控数据上报。

**请求**

```
POST /mp/jsmonitor?version={version}&x5={x5}&f={f}&user_article_role={user_article_role}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | string | 否 | 版本 |
| `x5` | string | 否 | X5 内核标识 |
| `f` | string | 否 | 格式 |
| `user_article_role` | string | 否 | 用户文章角色 |

**响应**

```json
{
  "ret": 0,
  "errmsg": "ok",
  "cookie_count": 0,
  "base_resp": {
    "ret": 0,
    "errmsg": "ok",
    "cookie_count": 0,
    "sessionid": ""
  },
  "sessionid": ""
}
```

**平均响应时间**: 169ms

---

## 接口响应时间统计

| 接口 | 平均响应时间 | 分类 |
|------|-------------|------|
| /cgi-bin/appmsgpublish | 979ms | 慢 |
| /cgi-bin/mppromotionorder | 850ms | 慢 |
| /merchant/ad_seller_manager | 695ms | 慢 |
| /wxamp/cgi/newtmpl/get_pritmpllist | 586ms | 中 |
| /cgi-bin/switchacct | 492ms | 中 |
| /cgi-bin/mpaigenpic | 481ms | 中 |
| /cgi-bin/zhuge_mp | 481ms | 中 |
| /cgi-bin/announce | 474ms | 中 |
| /cgi-bin/operate_appmsg (GET) | 445ms | 中 |
| /cgi-bin/bizlogin | 462ms | 中 |
| /cgi-bin/appmsg (POST) | 324ms | 正常 |
| /cgi-bin/windowproduct (GET) | 237ms | 正常 |
| /cgi-bin/windowproduct (POST) | 231ms | 正常 |
| /cgi-bin/operate_appmsg (POST) | 206ms | 正常 |
| /cgi-bin/featuredlist | 201ms | 正常 |
| /mp/jsmonitor | 169ms | 正常 |
| /cgi-bin/mmbizfrontendcommstore (GET) | 150ms | 正常 |
| /cgi-bin/webreport | 143ms | 正常 |
| /webpoc/cgi/chat/checkChatPermission | 132ms | 正常 |
| /cgi-bin/home | 131ms | 正常 |
| /advanced/mplog | 130ms | 正常 |
| /cgi-bin/scanloginqrcode | 102ms | 正常 |
| /cgi-bin/mmbizfrontendcommstore (POST) | 111ms | 正常 |
| /cgi-bin/masssend | 121ms | 正常 |
| /mp/webcommreport | 132ms | 正常 |
| /mp/wapcommreport | 57ms | 快 |

---

## 注意事项

1. **认证要求**: 所有接口都需要有效的 `token` 和登录 cookie
2. **频率限制**: 高频调用可能触发风控
3. **内部接口**: 这些是微信公众平台内部 API，可能随时变更
4. **仅供学习**: 本文档仅供学习研究使用，请勿用于非法用途

---

*文档生成时间: 2026-03-16*
