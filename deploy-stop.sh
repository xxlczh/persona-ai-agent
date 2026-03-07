#!/bin/bash

# 停止并清理部署环境

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 停止服务 ===${NC}"

# 停止所有服务
echo -e "${YELLOW}停止所有服务...${NC}"
docker-compose down

echo -e "${GREEN}服务已停止${NC}"
echo -e "${YELLOW}如需删除数据卷，请运行: docker-compose down -v${NC}"
