@echo off
REM Neo MVP 快速启动脚本（Windows）
echo ====================================
echo Neo MVP 快速启动
echo ====================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js ^>= 18
    pause
    exit /b 1
)

echo [1/5] 检查 Docker 是否运行...
docker ps >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] Docker 未运行，请手动启动 Docker 和 PostgreSQL
    echo 或者使用: docker-compose up -d
    pause
)

echo [2/5] 启动数据库容器...
docker-compose up -d

echo [3/5] 设置后端环境...
cd neo-backend
if not exist .env (
    echo 复制环境变量文件...
    copy .env.example .env
    echo [提示] 请编辑 .env 文件配置数据库连接
)

echo [4/5] 安装后端依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)

echo [5/5] 初始化数据库...
call npm run prisma:generate
call npm run prisma:migrate

echo.
echo ====================================
echo 启动后端服务...
echo ====================================
echo.
echo 后端将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务
echo.

start cmd /k "npm run dev"

echo.
echo ====================================
echo 下一步：
echo 1. 等待后端服务启动完成
echo 2. 在另一个终端运行: cd neo-extension ^&^& npm install ^&^& npm run build
echo 3. 在 Chrome 中加载插件
echo ====================================
echo.

pause

