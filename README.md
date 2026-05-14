# 用户画像智能生成系统 (Persona AI Agent)

基于LLM的智能用户画像生成系统，通过输入用户相关数据（人口统计、行为数据、原始文本等），利用大语言模型生成结构化用户画像，并提供多维度质量评估。

## 技术栈

- **前端**: Vue 3 + Element Plus + Vite
- **后端**: Node.js + Express + Sequelize
- **数据库**: MySQL + Redis
- **AI**: DeepSeek / 智谱GLM-5.1 / MiniMax-M2.7

## 功能特性

- **三种生成模式**: 极简模式（自然语言）、精准模式（数据驱动）、混合迭代模式
- **团队协作**: 支持团队创建、成员邀请、项目共享
- **质量评估**: 多维度评估（完整性、一致性、真实性、可操作性）
- **扩展工具**: 用研问卷生成、营销脚本生成、产品建议报告
- **作品广场**: 分享和浏览优秀作品
- **多模型支持**: DeepSeek、智谱GLM-5.1、MiniMax-M2.7

## 项目结构

```
persona-ai-agent/
├── backend/           # 后端代码
│   └── src/
│       ├── config/   # 配置文件
│       ├── models/  # 数据模型
│       ├── routes/   # API路由
│       ├── services/ # 业务逻辑
│       ├── middleware/ # 中间件
│       └── services/llm/ # LLM适配器
├── frontend/         # 前端代码
│   └── src/
│       ├── api/     # API客户端
│       ├── components/ # Vue组件
│       ├── views/    # 页面视图
│       └── router/  # 路由配置
└── database/         # 数据库脚本
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Redis >= 6.0

### 安装

```bash
# 克隆项目
git clone https://github.com/xxlczh/persona-ai-agent.git
cd persona-ai-agent

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

```bash
# 后端配置
cd backend
cp .env.example .env
# 编辑 .env 填入数据库和API密钥配置
```

### 启动

```bash
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

访问 http://localhost:5173

## 用户指南

详见 [USER_GUIDE.md](USER_GUIDE.md)

## API文档

详见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 测试

详见 [TESTING.md](TESTING.md)

## 许可证

MIT