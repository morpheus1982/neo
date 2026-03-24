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

# 检查是否已登录微信公众平台
check_mp_login() {
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null || echo "{}")

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
            echo ""
            return 0
        fi

        echo -n "."
    done

    echo ""
    return 1
}

# 导航到草稿编辑页
navigate_to_editor() {
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # Step 4a: 点击"草稿箱"菜单
    local draft_ref
    draft_ref=$(echo "$snapshot" | grep "草稿箱" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -z "$draft_ref" ]]; then
        log_error "未找到草稿箱菜单"
        return 1
    fi

    neo click "$draft_ref" > /dev/null 2>&1
    sleep 2
    log_success "已进入草稿箱"

    # Step 4b: 点击"新的创作"按钮
    snapshot=$(neo snapshot 2>/dev/null)
    local new_ref
    new_ref=$(echo "$snapshot" | grep -E "新的创作|写新图文" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -z "$new_ref" ]]; then
        log_error "未找到新建草稿按钮"
        return 1
    fi

    neo click "$new_ref" > /dev/null 2>&1
    sleep 3
    log_success "编辑器已加载"

    return 0
}

# 填写草稿标题
fill_title() {
    local title="$1"
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找标题输入框（第一个 textbox）
    local title_ref
    title_ref=$(echo "$snapshot" | grep "textbox" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -n "$title_ref" ]]; then
        neo fill "$title_ref" "$title" > /dev/null 2>&1
        log_success "标题: ${title}"
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
    author_ref=$(echo "$snapshot" | grep -i "作者" | grep -E "textbox|text" | head -1 | grep -oP '@\d+' | head -1)

    if [[ -n "$author_ref" ]]; then
        neo fill "$author_ref" "$author" > /dev/null 2>&1
        log_success "作者: ${author}"
        return 0
    fi
    # 作者字段可选
    log_info "未找到作者输入框（可选字段）"
    return 0
}

# 填写正文
fill_content() {
    local content="$1"
    local snapshot
    snapshot=$(neo snapshot 2>/dev/null)

    # 查找正文编辑区域
    local content_ref
    content_ref=$(echo "$snapshot" | grep "textbox" | tail -1 | grep -oP '@\d+' | head -1)

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

    # 检查 neo 命令
    if ! command -v neo &> /dev/null; then
        log_error "neo CLI 未安装"
        log_info "请运行: npm i -g @4ier/neo"
        exit 1
    fi
    log_success "neo CLI 已安装"

    # 检查 CDP 连接（通过 neo doctor）
    log_info "检查 CDP 连接..."
    if ! neo doctor 2>&1 | grep -qi "cdp\|connected\|ok"; then
        log_error "CDP 连接失败"
        log_info "请确保 Chrome 已启动: neo start"
        exit 1
    fi
    log_success "CDP 连接正常"

    # 检查 Neo 扩展状态
    log_info "检查 Neo 扩展..."
    if ! neo doctor 2>&1 | grep -qi "extension\|扩展"; then
        log_error "Neo 扩展未安装或未激活"
        log_info "请检查 chrome://extensions"
        exit 1
    fi
    log_success "Neo 扩展正常"

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

    # Step 4: 进入草稿编辑页
    log_step 4 ${total_steps} "进入草稿编辑页"
    if ! navigate_to_editor; then
        log_error "无法进入草稿编辑页"
        log_info "请手动检查页面状态"
        exit 1
    fi

    # Step 5: 填写草稿内容
    log_step 5 ${total_steps} "填写草稿内容"
    sleep 2  # 等待编辑器完全加载

    fill_title "$TITLE"
    fill_author "$AUTHOR"
    fill_content "$CONTENT"

    # Step 6: 保存草稿
    log_step 6 ${total_steps} "保存草稿"
    echo "TODO: 实现"

    # Step 7: 生成 API 文档
    log_step 7 ${total_steps} "生成 API 文档"
    echo "TODO: 实现"

    # Step 8: 清理
    log_step 8 ${total_steps} "清理"
    echo "TODO: 实现"

    echo ""
    echo "============================================"
    echo "  ✅ 完成！"
    echo "============================================"
}

main "$@"
