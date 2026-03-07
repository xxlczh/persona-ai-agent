# 部署文档

## 环境要求

### 基础环境

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 18.x | 20.x LTS |
| MySQL | 8.0 | 8.0.35+ |
| Redis | 7.0 | 7.2.0+ |
| Nginx | 1.20 | 1.24+ |

### 服务器配置建议

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| CPU | 2 核 | 4+ 核 |
| 内存 | 4 GB | 8+ GB |
| 磁盘 | 20 GB | 50+ GB |

## 部署架构

```
                              ┌─────────────┐
                              │   Nginx     │
                              │  (反向代理)  │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
     ┌──────────┐             ┌──────────┐             ┌──────────┐
     │ Backend 1│             │ Backend 2│             │ Backend 3│
     │ (Node.js)│             │ (Node.js)│             │ (Node.js)│
     └─────┬────┘             └─────┬────┘             └─────┬────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
     ┌──────────┐             ┌──────────┐             ┌──────────┐
     │  MySQL   │             │  Redis   │             │  LLM API │
     │ (主数据库)│             │  (缓存)   │             │  (AI服务) │
     └──────────┘             └──────────┘             └──────────┘
```

## 部署步骤

### 1. 环境准备

#### 1.1 安装 Node.js

```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 验证安装
node --version  # 应显示 v20.x.x
npm --version
```

#### 1.2 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 创建数据库
mysql -u root -p
CREATE DATABASE persona_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 1.3 安装 Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis

# 测试连接
redis-cli ping  # 应返回 PONG
```

#### 1.4 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 项目部署

#### 2.1 获取代码

```bash
# 克隆项目
git clone <repository-url> /var/www/persona-ai
cd /var/www/persona-ai
```

#### 2.2 安装依赖

```bash
# 安装后端依赖
cd backend
npm install --production

# 安装前端依赖
cd ../frontend
npm install

# 构建前端
npm run build
```

#### 2.3 配置环境变量

```bash
# 后端配置
cp backend/.env.example backend/.env
nano backend/.env
```

关键配置项:

```env
# 服务配置
PORT=3000
NODE_ENV=production

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=persona_ai
DB_USER=persona_user
DB_PASSWORD=strong_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=very_long_random_string_here
JWT_EXPIRES_IN=7d

# LLM 配置 (至少配置一个)
OPENAI_API_KEY=sk-xxx
# 或
ERNIE_API_KEY=xxx
ERNIE_SECRET_KEY=xxx
# 或
ZHIPU_API_KEY=xxx
```

#### 2.4 创建数据库用户

```bash
mysql -u root -p

CREATE USER 'persona_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON persona_ai.* TO 'persona_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置 Nginx

创建 Nginx 配置文件:

```bash
sudo nano /etc/nginx/sites-available/persona-ai
```

```nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/persona-ai/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件大小限制
    client_max_body_size 50M;
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/persona-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 PM2 进程管理

```bash
# 安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cd /var/www/persona-ai/backend
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'persona-ai-backend',
      script: 'src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/persona-ai-error.log',
      out_file: '/var/log/pm2/persona-ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

启动服务:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 按提示配置开机自启
```

### 5. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 6. 配置 HTTPS (可选但推荐)

使用 Let's Encrypt 免费证书:

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo certbot renew --dry-run
```

### 7. 验证部署

```bash
# 检查后端服务状态
pm2 status

# 检查 API
curl http://localhost:3000/api/health

# 检查前端
curl http://localhost/
```

---

## 运维指南

### 日志管理

```bash
# 查看后端日志
pm2 logs persona-ai-backend

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 日志轮转配置
sudo nano /etc/logrotate.d/persona-ai
```

### 性能优化

#### 1. Node.js 性能优化

- 使用 PM2 集群模式
- 配置适当的内存限制
- 启用 HTTP/2

#### 2. 数据库优化

- 添加适当索引
- 配置连接池
- 启用查询缓存

#### 3. Redis 优化

- 配置持久化
- 设置适当的过期策略
- 使用内存优化

### 备份策略

#### 1. 数据库备份

```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u persona_user -p persona_ai > /backup/persona_ai_$DATE.sql
find /backup -type f -mtime +7 -delete
```

添加到 crontab:

```bash
crontab -e
0 2 * * * /path/to/backup.sh
```

#### 2. 文件备份

- 备份上传的文件
- 备份配置文件
- 备份环境变量

### 监控

建议使用以下工具监控:

- **PM2 Plus**: PM2 官方监控服务
- **Prometheus + Grafana**: 指标监控
- **ELK Stack**: 日志分析

### 故障排查

常见问题及解决方案:

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| API 返回 502 | 后端未启动 | `pm2 restart all` |
| 数据库连接失败 | 配置错误 | 检查 .env 中的数据库配置 |
| 上传失败 | 权限问题 | 检查上传目录权限 |
| LLM 调用失败 | API Key 错误 | 检查环境变量配置 |
| 前端加载慢 | Nginx 配置问题 | 检查静态文件路径 |

---

## Docker 部署 (可选)

### 使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: persona_ai
      MYSQL_USER: persona_user
      MYSQL_PASSWORD: persona_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"

volumes:
  mysql_data:
  redis_data:
```

启动:

```bash
docker-compose up -d
```

---

## 安全建议

1. **定期更新**: 保持 Node.js 和依赖包更新
2. **密钥管理**: 使用环境变量管理敏感信息
3. **访问控制**: 限制数据库和 Redis 访问
4. **HTTPS**: 启用 HTTPS 加密传输
5. **日志审计**: 定期审查日志
6. **备份**: 定期备份数据库和配置文件
