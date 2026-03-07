# 用户画像语义模型开发

基于 LLM 的用户画像智能生成系统，通过输入用户相关数据（人口统计、行为数据、原始文本等），利用大语言模型生成结构化用户画像，并提供多维度质量评估。

## 功能特性

- **多模型支持**: 支持 OpenAI GPT、百度文心一言、智谱 GLM 等多种 LLM
- **智能生成**: 基于用户数据自动生成结构化用户画像
- **质量评估**: 多维度评估画像质量（完整性、一致性、真实性、可操作性）
- **批量生成**: 支持批量生成多个用户画像
- **数据源管理**: 支持多种数据源类型（JSON、CSV、文本、PDF）
- **Prompt 模板**: 可配置的 Prompt 模板系统
- **导出功能**: 支持导出画像为 JSON、PDF 等格式

## 技术栈

### 前端
- Vue 3
- Vite 5
- Element Plus
- Pinia (状态管理)
- Vue Router
- Axios
- ECharts (图表)

### 后端
- Node.js 18+
- Express 4
- Sequelize 6
- MySQL 8
- Redis 7
- JWT 认证

### AI 服务
- OpenAI (GPT-4/GPT-3.5)
- 百度文心一言
- 智谱 GLM-4

## 项目结构

```
persona-ai-agent/
├── backend/                 # 后端服务
│   └── src/
│       ├── config/          # 配置文件
│       ├── middleware/      # 中间件
│       ├── models/          # 数据模型
│       ├── routes/          # 路由
│       ├── services/        # 业务服务
│       ├── prompts/         # Prompt 模板
│       └── utils/           # 工具函数
│
├── frontend/                # 前端应用
│   └── src/
│       ├── components/      # 组件
│       ├── views/           # 页面
│       ├── stores/          # 状态管理
│       ├── router/          # 路由配置
│       └── api/             # API 调用
│
└── docs/                    # 文档
    ├── API.md              # API 文档
    ├── DEPLOY.md           # 部署文档
    └── MANUAL.md           # 使用手册
```

## 快速开始

### 前置要求

- Node.js 18.x+
- MySQL 8.x
- Redis 7.x
- LLM API Key (可选)

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd persona-ai-agent

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

1. 复制环境变量文件

```bash
# 后端
cp backend/.env.example backend/.env

# 编辑 backend/.env 配置数据库和 Redis
```

2. 关键配置项说明

```env
# 后端配置
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=persona_ai
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# LLM 配置 (至少配置一个)
# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4

# 百度文心一言
ERNIE_API_KEY=your_ernie_key
ERNIE_SECRET_KEY=your_ernie_secret

# 智谱 GLM
ZHIPU_API_KEY=your_zhipu_key
```

### 启动

```bash
# 启动后端 (开发模式)
cd backend
npm run dev

# 启动前端 (开发模式)
cd frontend
npm run dev
```

后端服务运行在 http://localhost:3000
前端应用运行在 http://localhost:5173

### 构建生产版本

```bash
# 前端构建
cd frontend
npm run build
```

## 使用流程

1. **注册/登录**: 创建账号并登录系统
2. **创建项目**: 新建一个项目并选择 LLM 提供商
3. **上传数据**: 上传用户数据（JSON、CSV、文本等）
4. **生成画像**: 选择数据源并生成用户画像
5. **质量评估**: 查看画像质量评估结果
6. **导出使用**: 导出画像数据进行后续使用

## API 概览

| 模块 | 说明 |
|------|------|
| /api/users | 用户认证与管理 |
| /api/projects | 项目管理 |
| /api/datasources | 数据源管理 |
| /api/persona | 画像生成与管理 |
| /api/evaluation | 质量评估 |
| /api/prompt-templates | Prompt 模板管理 |
| /api/health | 健康检查 |

详细 API 文档请参阅 [API.md](docs/API.md)

## 部署

详细的部署说明请参阅 [DEPLOY.md](docs/DEPLOY.md)

## 使用手册

详细的使用说明请参阅 [MANUAL.md](docs/MANUAL.md)

## 许可证

MIT License
