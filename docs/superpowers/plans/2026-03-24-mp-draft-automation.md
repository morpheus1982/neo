# 微信公众平台草稿自动化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `tools/mp-draft.sh` 脚本，实现微信公众平台草稿自动化创建和 API 文档生成。

**Architecture:** Shell 脚本调用 neo CLI 命令，通过 UI 自动化完成草稿创建，同时捕获 API 流量并生成文档。

**Tech Stack:** Bash, neo CLI, Chrome DevTools Protocol

---

## 文件结构

```
D:\src\third\neo\
├── tools/
│   └── mp-draft.sh          # 创建：自动化脚本
├── mp-api.md                # 更新：API 文档
└── docs/superpowers/specs/
    └── 2026-03-24-mp-draft-automation-design.md  # 现有：设计文档
```

---

## Task 1: 脚本框架与参数解析

**Files:**
- Create: `tools/mp-draft.sh`

- [ ] **Step 1: 创建脚本骨架和参数解析**

创建 `tools/mp-draft.sh`：

```bash
#!/bin/bash
# mp-draft.sh - 微信公众平台草稿自动化脚本
#
# 用法:
#   ./tools/mp-draft.sh [--title "标题"] [--content "正文"] [--author "作者"] [--skip-schema] [--keep-tab]
#
# 依赖:
#   - neo CLI (npm i -g @4ier/neo)
#   - Chrome 浏览器 (启用 CDP 端口 9222)
#   - Neo 扩展已安装

set -e

# ============================================
# 配置
# ============================================
readonly SCRIPT_NAME=$(basename "$0")
readonly DATE_STAMP=$(date +%Y-%m-%d)
readonly MP_URL="https://mp.weixin.qq.com"
readonly MAX_LOGIN_WAIT=120      # 最长等待扫码时间(秒)
readonly LOGIN_CHECK_INTERVAL=3  # 登录检查间隔(秒)

# 默认值
TITLE="测试文章 - ${DATE_STAMP}"
AUTHOR="测试作者"
CONTENT="这是一篇通过 Neo 自动化创建的测试草稿。用于验证 API 捕获和自动化流程的可行性。"
SKIP_SCHEMA=false
KEEP_TAB=false

# ============================================
# 参数解析
# ============================================
usage() {
    cat << EOF
用法: ${SCRIPT_NAME} [选项]

选项:
  --title TEXT      草稿标题 (默认: "测试文章 - ${DATE_STAMP}")
  --author TEXT     作者名 (默认: "测试作者")
  --content TEXT    草稿正文 (默认: 测试文本)
  --skip-schema     跳过 schema 生成
  --keep-tab        完成后保持标签页打开
  -h, --help        显示帮助信息

示例:
  ${SCRIPT_NAME}
  ${SCRIPT_NAME} --title "我的文章" --content "正文内容"
EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --author)
            AUTHOR="$2"
            shift 2
            ;;
        --content)
            CONTENT="$2"
            shift 2
            ;;
        --skip-schema)
            SKIP_SCHEMA=true
            shift
            ;;
        --keep-tab)
            KEEP_TAB=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "错误: 未知参数 $1"
            usage
            exit 1
            ;;
    esac
done

# ============================================
# 工具函数
# ============================================
log_step() {
    local step=$1
    local total=$2
    local message=$3
    echo "[${step}/${total}] ${message}..."
}

log_success() {
    echo "✓ $1"
}

log_error() {
    echo "✗ $1"
}

log_info() {
    echo "  $1"
}

# ============================================
# 主流程
# ============================================
main() {
    local total_steps=8

    echo "============================================"
    echo "  微信公众平台草稿自动化"
    echo "============================================"
    echo ""
    log_info "标题: ${TITLE}"
    log_info "作者: ${AUTHOR}"
    log_info "正文: ${CONTENT:0:50}..."
    echo ""

    # Step 1: 环境检查
    log_step 1 ${total_steps} "环境检查"
    # TODO: 实现

    # Step 2: 打开页面
    log_step 2 ${total_steps} "打开微信公众平台"
    # TODO: 实现

    # Step 3: 检测登录状态
    log_step 3 ${total_steps} "检测登录状态"
    # TODO: 实现

    # Step 4: 进入草稿编辑页
    log_step 4 ${total_steps} "进入草稿编辑页"
    # TODO: 实现

    # Step 5: 填写草稿内容
    log_step 5 ${total_steps} "填写草稿内容"
    # TODO: 实现

    # Step 6: 保存草稿
    log_step 6 ${total_steps} "保存草稿"
    # TODO: 实现

    # Step 7: 生成 API 文档
    log_step 7 ${total_steps} "生成 API 文档"
    # TODO: 实现

    # Step 8: 清理
    log_step 8 ${total_steps} "清理"
    # TODO: 实现

    echo ""
    echo "============================================"
    echo "  ✅ 完成！"
    echo "============================================"
}

main "$@"
```

- [ ] **Step 2: 验证脚本语法**

```bash
bash -n tools/mp-draft.sh && echo "语法检查通过"
```

预期输出: `语法检查通过`

- [ ] **Step 3: 测试帮助信息**

```bash
./tools/mp-draft.sh --help
```

预期输出: 显示用法说明

- [ ] **Step 4: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add script skeleton with argument parsing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 环境检查

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 实现 Step 1 环境检查函数**

在 `main()` 函数的 Step 1 部分替换为：

```bash
# Step 1: 环境检查
log_step 1 ${total_steps} "环境检查"

# 检查 neo 命令
if ! command -v neo &> /dev/null; then
    log_error "neo CLI 未安装"
    log_info "请运行: npm i -g @4ier/neo"
    exit 1
fi
log_success "neo CLI 已安装"

# 检查 CDP 连接
if ! neo doctor 2>&1 | grep -q "CDP"; then
    log_error "CDP 连接失败"
    log_info "请确保 Chrome 已启动并启用 CDP: neo start"
    exit 1
fi
log_success "CDP 连接正常"

# 检查 Neo 扩展
if ! neo doctor 2>&1 | grep -q "Extension"; then
    log_error "Neo 扩展未安装或未激活"
    log_info "请检查 chrome://extensions"
    exit 1
fi
log_success "Neo 扩展正常"
```

- [ ] **Step 2: 测试环境检查（在 Neo 环境正常时）**

```bash
./tools/mp-draft.sh --skip-schema --keep-tab 2>&1 | head -20
```

预期输出: 显示环境检查通过

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add environment check (neo CLI, CDP, extension)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 打开页面与登录检测

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 添加辅助函数**

在 `工具函数` 部分添加：

```bash
# 检查是否已登录微信公众平台
check_mp_login() {
    local snapshot
    snapshot=$(neo snapshot --json 2>/dev/null || echo "{}")

    # 检查是否存在"草稿箱"菜单（已登录标志）
    if echo "$snapshot" | grep -q "草稿箱"; then
        return 0
    fi
    return 1
}

# 等待用户扫码登录
wait_for_login() {
    local waited=0
    echo ""
    log_info "请在浏览器中扫码登录..."
    log_info "最长等待 ${MAX_LOGIN_WAIT} 秒"

    while [[ $waited -lt $MAX_LOGIN_WAIT ]]; do
        sleep $LOGIN_CHECK_INTERVAL
        waited=$((waited + LOGIN_CHECK_INTERVAL))

        if check_mp_login; then
            return 0
        fi

        echo -n "."
    done

    echo ""
    return 1
}
```

- [ ] **Step 2: 实现 Step 2 和 Step 3**

替换 `main()` 中的 Step 2 和 Step 3：

```bash
# Step 2: 打开页面
log_step 2 ${total_steps} "打开微信公众平台"
neo open "$MP_URL" > /dev/null 2>&1
sleep 3  # 等待页面加载
log_success "已打开 ${MP_URL}"

# Step 3: 检测登录状态
log_step 3 ${total_steps} "检测登录状态"
if check_mp_login; then
    log_success "已登录"
else
    log_info "未登录，等待扫码..."
    if wait_for_login; then
        log_success "登录成功"
    else
        log_error "登录超时"
        exit 1
    fi
fi
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add page open and login detection

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 进入草稿编辑页

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 添加导航函数**

在 `工具函数` 部分添加：

```bash
# 通过 UI 导航到草稿编辑页
navigate_to_editor() {
    # 获取页面快照
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找并点击"草稿箱"菜单
    local draft_ref
    draft_ref=$(echo "$snapshot" | grep -i "草稿箱" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -z "$draft_ref" ]]; then
        # 尝试在左侧菜单中查找
        log_info "尝试查找创作菜单..."
        local create_ref
        create_ref=$(echo "$snapshot" | grep -i "创作" | head -1 | grep -oP '@\d+' | head -1)
        if [[ -n "$create_ref" ]]; then
            neo click "$create_ref" > /dev/null 2>&1
            sleep 2
            snapshot=$(neo snapshot 2>/dev/null)
            draft_ref=$(echo "$snapshot" | grep -i "草稿箱" | head -1 | grep -oP '@\d+' | head -1)
        fi
    fi

    if [[ -n "$draft_ref" ]]; then
        neo click "$draft_ref" > /dev/null 2>&1
        sleep 2
        log_success "已进入草稿箱"
    else
        log_error "未找到草稿箱菜单"
        return 1
    fi

    # 点击"新的创作"按钮
    snapshot=$(neo snapshot 2>/dev/null)
    local new_draft_ref
    new_draft_ref=$(echo "$snapshot" | grep -iE "新的创作|新建|写新图文" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -n "$new_draft_ref" ]]; then
        neo click "$new_draft_ref" > /dev/null 2>&1
        sleep 3  # 等待编辑器加载
        log_success "编辑器已加载"
    else
        log_error "未找到新建草稿按钮"
        return 1
    fi

    return 0
}
```

- [ ] **Step 2: 实现 Step 4**

替换 `main()` 中的 Step 4：

```bash
# Step 4: 进入草稿编辑页
log_step 4 ${total_steps} "进入草稿编辑页"
if ! navigate_to_editor; then
    log_error "无法进入草稿编辑页"
    log_info "请手动检查页面状态"
    exit 1
fi
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add navigation to draft editor

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 填写草稿内容

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 添加填写函数**

在 `工具函数` 部分添加：

```bash
# 填写草稿标题
fill_title() {
    local title="$1"
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找标题输入框
    local title_ref
    title_ref=$(echo "$snapshot" | grep -iE "标题|title" | grep -i "textbox\|text" | head -1 | grep -oP '@\d+' | head -1)

    # 如果没找到，尝试找第一个文本输入框
    if [[ -z "$title_ref" ]]; then
        title_ref=$(echo "$snapshot" | grep "textbox" | head -1 | grep -oP '@\d+' | head -1)
    fi

    if [[ -n "$title_ref" ]]; then
        neo fill "$title_ref" "$title" > /dev/null 2>&1
        log_success "标题已填写: ${title}"
        return 0
    else
        log_error "未找到标题输入框"
        return 1
    fi
}

# 填写作者
fill_author() {
    local author="$1"
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找作者输入框
    local author_ref
    author_ref=$(echo "$snapshot" | grep -iE "作者|author" | grep -i "textbox\|text" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -n "$author_ref" ]]; then
        neo fill "$author_ref" "$author" > /dev/null 2>&1
        log_success "作者已填写: ${author}"
        return 0
    fi
    # 作者字段可能是可选的
    log_info "未找到作者输入框（可能为可选字段）"
    return 0
}

# 填写正文
fill_content() {
    local content="$1"
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找正文编辑区域（通常是 textarea 或 contenteditable）
    local content_ref
    # 尝试多种匹配模式
    content_ref=$(echo "$snapshot" | grep -iE "正文|content|编辑|editor" | grep -iE "textbox|text|edit" | head -1 | grep -oP '@\d+' | head -1)

    # 如果没找到，尝试找 iframe 中的编辑器
    if [[ -z "$content_ref" ]]; then
        # 尝试点击编辑区域后再输入
        content_ref=$(echo "$snapshot" | grep "textbox" | tail -1 | grep -oP '@\d+' | head -1)
    fi

    if [[ -n "$content_ref" ]]; then
        neo click "$content_ref" > /dev/null 2>&1
        sleep 1
        neo fill "$content_ref" "$content" > /dev/null 2>&1
        log_success "正文已填写"
        return 0
    else
        log_error "未找到正文编辑区域"
        return 1
    fi
}
```

- [ ] **Step 2: 实现 Step 5**

替换 `main()` 中的 Step 5：

```bash
# Step 5: 填写草稿内容
log_step 5 ${total_steps} "填写草稿内容"
sleep 2  # 等待编辑器完全加载

fill_title "$TITLE"
fill_author "$AUTHOR"
fill_content "$CONTENT"
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add content filling functions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 保存草稿

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 添加保存函数**

在 `工具函数` 部分添加：

```bash
# 保存草稿
save_draft() {
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找"保存为草稿"按钮
    local save_ref
    save_ref=$(echo "$snapshot" | grep -iE "保存为草稿|保存草稿|存为草稿" | head -1 | grep -oP '@\d+' | head -1)

    # 如果没找到，尝试查找"保存"按钮
    if [[ -z "$save_ref" ]]; then
        save_ref=$(echo "$snapshot" | grep -i "保存" | grep -i "button" | head -1 | grep -oP '@\d+' | head -1)
    fi

    if [[ -n "$save_ref" ]]; then
        neo click "$save_ref" > /dev/null 2>&1
        sleep 3  # 等待保存完成
        log_success "草稿已保存"
        return 0
    else
        log_error "未找到保存按钮"
        return 1
    fi
}
```

- [ ] **Step 2: 实现 Step 6**

替换 `main()` 中的 Step 6：

```bash
# Step 6: 保存草稿
log_step 6 ${total_steps} "保存草稿"
if ! save_draft; then
    log_error "保存失败"
    exit 1
fi
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add save draft function

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 生成 API 文档

**Files:**
- Modify: `tools/mp-draft.sh`
- Modify: `mp-api.md`

- [ ] **Step 1: 添加文档生成函数**

在 `工具函数` 部分添加：

```bash
# 生成 API 文档
generate_api_doc() {
    local domain="mp.weixin.qq.com"
    local schema_file="$HOME/.neo/schemas/${domain}.json"
    local doc_file="$(dirname "$0")/../mp-api.md"

    log_info "生成 schema..."
    neo schema generate "$domain" > /dev/null 2>&1

    if [[ ! -f "$schema_file" ]]; then
        log_error "Schema 文件未生成"
        return 1
    fi

    log_success "Schema 已生成: ${schema_file}"

    # 获取新增捕获数
    local new_captures
    new_captures=$(neo capture count "$domain" 2>/dev/null | grep -oP '\d+' || echo "0")
    log_info "当前捕获数: ${new_captures}"

    # 更新 Markdown 文档
    log_info "更新 API 文档..."
    neo schema show "$domain" > /dev/null 2>&1

    # 更新 mp-api.md 的生成时间
    if [[ -f "$doc_file" ]]; then
        # 更新生成时间和统计
        local today=$(date +%Y-%m-%d)
        sed -i "s/> 生成时间:.*/> 生成时间: ${today}/" "$doc_file"

        # 更新捕获数
        local endpoint_count
        endpoint_count=$(neo schema show "$domain" --json 2>/dev/null | grep -oP '"uniqueEndpoints":\s*\K\d+' || echo "?")
        sed -i "s/> 唯一接口数:.*/> 唯一接口数: ${endpoint_count} 个/" "$doc_file"

        log_success "API 文档已更新: ${doc_file}"
    else
        log_info "mp-api.md 不存在，跳过更新"
    fi

    return 0
}
```

- [ ] **Step 2: 实现 Step 7**

替换 `main()` 中的 Step 7：

```bash
# Step 7: 生成 API 文档
log_step 7 ${total_steps} "生成 API 文档"
if [[ "$SKIP_SCHEMA" == "true" ]]; then
    log_info "已跳过 (--skip-schema)"
else
    if ! generate_api_doc; then
        log_error "文档生成失败"
        # 不退出，继续执行清理
    fi
fi
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add API documentation generation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 清理与完成摘要

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 实现清理函数和完成摘要**

在 `工具函数` 部分添加：

```bash
# 清理：关闭标签页
cleanup() {
    if [[ "$KEEP_TAB" == "true" ]]; then
        log_info "保持标签页打开 (--keep-tab)"
        return 0
    fi

    # 获取当前 mp.weixin.qq.com 的标签页
    local tabs
    tabs=$(neo tabs "mp.weixin.qq.com" 2>/dev/null)

    if [[ -n "$tabs" ]]; then
        # 尝试关闭标签页
        neo eval "window.close()" --tab "mp.weixin.qq.com" > /dev/null 2>&1 || true
        log_success "标签页已关闭"
    fi
}

# 输出完成摘要
print_summary() {
    local domain="mp.weixin.qq.com"
    local capture_count
    capture_count=$(neo capture count "$domain" 2>/dev/null | grep -oP '\d+' || echo "?")

    local endpoint_count
    endpoint_count=$(neo schema show "$domain" --json 2>/dev/null | grep -oP '"uniqueEndpoints":\s*\K\d+' || echo "?")

    echo ""
    echo "============================================"
    echo "  ✅ 完成！"
    echo "============================================"
    echo ""
    echo "摘要:"
    log_info "草稿标题: ${TITLE}"
    log_info "捕获总数: ${capture_count}"
    log_info "接口数量: ${endpoint_count}"
    echo ""
    log_info "查看捕获: neo capture list ${domain}"
    log_info "查看 Schema: neo schema show ${domain}"
    log_info "API 文档: mp-api.md"
}
```

- [ ] **Step 2: 实现 Step 8**

替换 `main()` 中的 Step 8 和完成部分：

```bash
# Step 8: 清理
log_step 8 ${total_steps} "清理"
cleanup

print_summary
```

- [ ] **Step 3: Commit**

```bash
git add tools/mp-draft.sh
git commit -m "feat(mp-draft): add cleanup and summary output

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 集成测试与文档

**Files:**
- Modify: `tools/mp-draft.sh`

- [ ] **Step 1: 验证完整脚本语法**

```bash
bash -n tools/mp-draft.sh && echo "✓ 语法检查通过"
```

- [ ] **Step 2: 添加使用说明到脚本头部**

更新脚本头部注释：

```bash
#!/bin/bash
# mp-draft.sh - 微信公众平台草稿自动化脚本
#
# 功能:
#   1. 打开微信公众平台
#   2. 自动检测登录状态（未登录则等待扫码）
#   3. 创建一篇测试草稿
#   4. 捕获 API 请求并生成文档
#
# 用法:
#   ./tools/mp-draft.sh                              # 使用默认测试内容
#   ./tools/mp-draft.sh --title "标题" --content "正文"
#   ./tools/mp-draft.sh --skip-schema --keep-tab    # 调试模式
#
# 选项:
#   --title TEXT      草稿标题
#   --author TEXT     作者名
#   --content TEXT    草稿正文
#   --skip-schema     跳过 schema 生成（调试用）
#   --keep-tab        保持标签页打开（调试用）
#   -h, --help        显示帮助
#
# 依赖:
#   - neo CLI: npm i -g @4ier/neo
#   - Chrome 浏览器 (启用 CDP: neo start)
#   - Neo 扩展已安装
#
# 示例:
#   # 基本使用
#   ./tools/mp-draft.sh
#
#   # 自定义内容
#   ./tools/mp-draft.sh --title "我的文章" --author "张三" --content "这是正文"
#
#   # 调试模式（不生成文档，保持标签页）
#   ./tools/mp-draft.sh --skip-schema --keep-tab
```

- [ ] **Step 3: 最终 Commit**

```bash
git add tools/mp-draft.sh
git commit -m "docs(mp-draft): add comprehensive usage documentation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 验收清单

- [ ] `./tools/mp-draft.sh --help` 显示帮助信息
- [ ] `./tools/mp-draft.sh --skip-schema --keep-tab` 能完成环境检查
- [ ] 完整流程能创建草稿并捕获 API
- [ ] `mp-api.md` 文档得到更新

---

## 执行后验证

运行完整测试：

```bash
# 1. 确保 Neo 环境正常
neo doctor

# 2. 运行脚本（调试模式先测试流程）
./tools/mp-draft.sh --skip-schema --keep-tab

# 3. 确认流程正常后，运行完整版本
./tools/mp-draft.sh

# 4. 验证捕获结果
neo capture list mp.weixin.qq.com --limit 10

# 5. 验证 schema 更新
neo schema show mp.weixin.qq.com
```
