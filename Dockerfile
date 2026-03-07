# 多阶段构建 Dockerfile - 同时构建前后端
FROM node:18-alpine AS builder

# ========== 构建前端 ==========
WORKDIR /app/frontend

# 复制前端 package.json
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源码
COPY frontend/ ./

# 构建前端
RUN npm run build

# ========== 构建后端 ==========
WORKDIR /app/backend

# 复制后端 package.json
COPY backend/package*.json ./

# 安装后端依赖
RUN npm install --production

# 复制后端源码
COPY backend/src ./src
COPY backend/.env.example ./.env

# ========== 生产阶段 ==========
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY --from=builder /app/backend ./

# 复制前端构建产物到静态目录
COPY --from=builder /app/frontend/dist ./public

# 暴露端口
EXPOSE 3000

# 启动后端服务
CMD ["npm", "start"]
