#!/bin/bash

# 部署脚本 - 用于生产环境部署

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 用户画像系统部署脚本 ===${NC}"

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 创建环境变量文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}创建环境变量文件...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}请编辑 .env 文件配置正确的环境变量${NC}"
fi

# 拉取最新代码 (如果使用 git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}拉取最新代码...${NC}"
    git pull
fi

# 构建并启动服务
echo -e "${YELLOW}构建 Docker 镜像...${NC}"
docker-compose build

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker-compose ps

# 显示服务日志
echo -e "${GREEN}部署完成！${NC}"
echo -e "前端地址: http://localhost:8080"
echo -e "后端地址: http://localhost:3000"
echo -e "MySQL地址: localhost:3306"
echo -e "Redis地址: localhost:6379"

echo -e "${YELLOW}查看日志: docker-compose logs -f${NC}"
echo -e "${YELLOW}停止服务: docker-compose down${NC}"
