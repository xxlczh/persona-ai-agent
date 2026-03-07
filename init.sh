#!/bin/bash

# ============================================================
# 用户画像语义模型开发 - 环境初始化脚本
# ============================================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  用户画像语义模型 - 环境初始化"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "\n${YELLOW}[1/6] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请访问 https://nodejs.org/ 安装 Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} 已安装${NC}"

# 检查 npm
echo -e "\n${YELLOW}[2/6] 检查 npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm 未安装${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} 已安装${NC}"

# 创建后端目录
echo -e "\n${YELLOW}[3/6] 创建项目目录结构...${NC}"
mkdir -p backend/src/{config,controllers,services,models,routes,middleware,prompts}
mkdir -p backend/src/utils
mkdir -p frontend/src/{api,components,views,stores,router,assets}
mkdir -p database/{migrations,seeds}
mkdir -p tests/screenshots
echo -e "${GREEN}✓ 目录结构已创建${NC}"

# 后端依赖安装
echo -e "\n${YELLOW}[4/6] 安装后端依赖...${NC}"
cd backend
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ 后端依赖已安装${NC}"
else
    echo -e "${YELLOW}! 后端 package.json 不存在，跳过依赖安装${NC}"
fi
cd ..

# 前端依赖安装
echo -e "\n${YELLOW}[5/6] 安装前端依赖...${NC}"
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ 前端依赖已安装${NC}"
else
    echo -e "${YELLOW}! 前端 package.json 不存在，跳过依赖安装${NC}"
fi
cd ..

# 环境变量检查
echo -e "\n${YELLOW}[6/6] 检查环境变量配置...${NC}"
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
else
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}! 已创建 .env 文件，请配置相关环境变量${NC}"
    else
        echo -e "${YELLOW}! 警告: .env 文件不存在，请手动创建${NC}"
    fi
fi

# Git 初始化
if [ ! -d ".git" ]; then
    echo -e "\n${YELLOW}初始化 Git 仓库...${NC}"
    git init
    git add -A
    git commit -m "chore: 初始项目结构"
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  环境初始化完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作:"
echo "  1. 配置 backend/.env 中的环境变量"
echo "  2. 启动后端: cd backend && npm run dev"
echo "  3. 启动前端: cd frontend && npm run dev"
echo ""
