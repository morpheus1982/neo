#!/bin/bash

# Neo MVP 快速启动脚本（Linux/Mac）

echo "===================================="
echo "Neo MVP 快速启动"
echo "===================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未找到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

echo "[1/5] 检查 Docker 是否运行..."
if ! docker ps &> /dev/null; then
    echo "[警告] Docker 未运行，请手动启动 Docker 和 PostgreSQL"
    echo "或者使用: docker-compose up -d"
    read -p "按 Enter 继续..."
fi

echo "[2/5] 启动数据库容器..."
docker-compose up -d

echo "[3/5] 设置后端环境..."
cd neo-backend
if [ ! -f .env ]; then
    echo "复制环境变量文件..."
    cp .env.example .env
    echo "[提示] 请编辑 .env 文件配置数据库连接"
fi

echo "[4/5] 安装后端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "[错误] 后端依赖安装失败"
    exit 1
fi

echo "[5/5] 初始化数据库..."
npm run prisma:generate
npm run prisma:migrate

echo ""
echo "===================================="
echo "启动后端服务..."
echo "===================================="
echo ""
echo "后端将在 http://localhost:3000 启动"
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev

