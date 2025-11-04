# Neo MVP API 测试脚本（PowerShell 版本）
# 用于快速测试后端 API 是否正常工作

$BACKEND_URL = "http://localhost:3000"

Write-Host "🚀 Neo MVP API 测试" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# 测试健康检查
Write-Host "1. 测试健康检查端点..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "✅ 后端服务正常: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行: $_" -ForegroundColor Red
}
Write-Host ""

# 测试获取 API 文档列表
Write-Host "2. 测试获取 API 文档列表..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/docs?limit=5" -Method Get
    $count = ($response.data | Measure-Object).Count
    Write-Host "✅ 找到 $count 个 API 文档" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法获取文档列表: $_" -ForegroundColor Red
}
Write-Host ""

# 测试获取技能列表
Write-Host "3. 测试获取技能列表..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/skills?limit=5" -Method Get
    $count = ($response.data | Measure-Object).Count
    Write-Host "✅ 找到 $count 个技能" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法获取技能列表: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ 测试完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "1. 在浏览器中加载插件"
Write-Host "2. 访问网站让插件捕获 API"
Write-Host "3. 触发 API 分析:"
Write-Host "   Invoke-RestMethod -Uri '$BACKEND_URL/api/docs/analyze-pending' -Method Post -Body '{\"limit\": 3}' -ContentType 'application/json'"

