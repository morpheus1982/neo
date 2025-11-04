#!/bin/bash

# Neo MVP API 测试脚本
# 用于快速测试后端 API 是否正常工作

BACKEND_URL="http://localhost:3000"

echo "🚀 Neo MVP API 测试"
echo "===================="
echo ""

# 测试健康检查
echo "1. 测试健康检查端点..."
curl -s "$BACKEND_URL/health" | jq '.' || echo "❌ 后端服务未运行"
echo ""

# 测试获取 API 文档列表
echo "2. 测试获取 API 文档列表..."
curl -s "$BACKEND_URL/api/docs?limit=5" | jq '.data | length' || echo "❌ 无法获取文档列表"
echo ""

# 测试获取技能列表
echo "3. 测试获取技能列表..."
curl -s "$BACKEND_URL/api/skills?limit=5" | jq '.data | length' || echo "❌ 无法获取技能列表"
echo ""

echo "✅ 测试完成！"
echo ""
echo "下一步："
echo "1. 在浏览器中加载插件"
echo "2. 访问网站让插件捕获 API"
echo "3. 触发 API 分析: curl -X POST $BACKEND_URL/api/docs/analyze-pending -H 'Content-Type: application/json' -d '{\"limit\": 3}'"

