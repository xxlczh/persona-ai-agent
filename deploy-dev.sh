#!/bin/bash

# 开发环境部署脚本 - 使用 Docker Compose 本地开发

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 用户画像系统开发环境部署 ===${NC}"

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 创建开发环境变量文件
if [ ! -f .env.dev ]; then
    echo -e "${YELLOW}创建开发环境变量文件...${NC}"
    cat > .env.dev << 'EOF'
# 开发环境配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=dev_password
DB_NAME=persona_ai_dev

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=
ERNIE_API_KEY=
ZHIPU_API_KEY=
LLM_PROVIDER=openai

NODE_ENV=development
PORT=3000
EOF
    echo -e "${YELLOW}已创建 .env.dev 文件${NC}"
fi

# 使用开发环境变量
export COMPOSE_FILE=docker-compose.yml
export $(cat .env.dev | grep -v '^#' | xargs)

# 启动服务
echo -e "${YELLOW}启动开发环境服务...${NC}"
docker-compose -f docker-compose.yml --env-file .env.dev up -d

# 等待 MySQL 初始化
echo -e "${YELLOW}等待 MySQL 初始化...${NC}"
sleep 15

# 显示服务状态
echo -e "${GREEN}开发环境启动完成！${NC}"
echo -e "前端地址: http://localhost:8080"
echo -e "后端地址: http://localhost:3000"
echo -e "MySQL地址: localhost:3306"
echo -e "Redis地址: localhost:6379"

# 显示容器状态
docker-compose ps
