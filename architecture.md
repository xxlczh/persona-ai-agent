# 用户画像语义模型开发 - 架构文档

## 项目概述

基于LLM的用户画像智能生成系统，用户可以通过上传用户数据（人口统计、行为数据、原始文本等），利用大语言模型生成结构化的用户画像，并获得多维度的质量评估结果。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 登录注册  │ │ 项目管理  │ │ 画像生成  │ │ 质量评估  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 (Node.js/Express)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 认证模块  │ │ 项目管理  │ │ 画像生成  │ │ 质量评估  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ LLM服务  │ │ 数据源   │ │ 日志服务  │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │ MySQL   │     │ Redis   │     │ LLM API │
        │ (数据)   │     │ (缓存)   │     │ (AI)    │
        └─────────┘     └─────────┘     └─────────┘
```

## 技术选型

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 框架 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | UI组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP客户端 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18.x+ | 运行时 |
| Express | 4.x | Web框架 |
| Sequelize | 6.x | ORM框架 |
| MySQL | 8.x | 数据库 |
| Redis | 7.x | 缓存 |
| JWT | - | 认证 |

### AI服务

| 服务商 | 模型 | 用途 |
|--------|------|------|
| OpenAI | GPT-4/GPT-3.5 | 画像生成 |
| 百度 | 文心一言 | 画像生成 |
| 智谱 | GLM-4 | 画像生成 |

## 数据库设计

### 核心表结构

#### 1. users - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2. projects - 项目表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 所属用户ID |
| name | VARCHAR(100) | 项目名称 |
| description | TEXT | 项目描述 |
| llm_provider | VARCHAR(20) | LLM供应商 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3. source_data - 数据源表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| project_id | INT | 所属项目ID |
| name | VARCHAR(100) | 数据名称 |
| type | VARCHAR(20) | 数据类型 |
| content | TEXT | 数据内容 |
| file_path | VARCHAR(255) | 文件路径 |
| created_at | DATETIME | 创建时间 |

#### 4. personas - 用户画像表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| project_id | INT | 所属项目ID |
| source_data_id | INT | 数据源ID |
| name | VARCHAR(100) | 画像名称 |
| demographic | JSON | 人口统计特征 |
| behavioral | JSON | 行为特征 |
| psychological | JSON | 心理特征 |
| needs | JSON | 需求特征 |
| scenarios | JSON | 场景特征 |
| raw_response | TEXT | 原始响应 |
| evaluation_score | FLOAT | 评估分数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 5. generation_logs - 生成日志表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| project_id | INT | 所属项目ID |
| persona_id | INT | 画像ID |
| prompt_tokens | INT | Prompt tokens |
| completion_tokens | INT | Completion tokens |
| duration | INT | 生成耗时(ms) |
| status | VARCHAR(20) | 状态 |
| error_message | TEXT | 错误信息 |
| created_at | DATETIME | 创建时间 |

## API 接口设计

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取用户信息 |

### 项目接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/projects | 创建项目 |
| GET | /api/projects | 获取项目列表 |
| GET | /api/projects/:id | 获取项目详情 |
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |

### 数据源接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/source-data/upload | 上传数据 |
| GET | /api/source-data | 获取数据列表 |
| GET | /api/source-data/:id | 获取数据详情 |
| DELETE | /api/source-data/:id | 删除数据 |

### 画像生成接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/persona/generate | 生成画像 |
| GET | /api/persona | 获取画像列表 |
| GET | /api/persona/:id | 获取画像详情 |
| PUT | /api/persona/:id | 更新画像 |
| DELETE | /api/persona/:id | 删除画像 |

### 质量评估接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/evaluation/persona/:id | 评估画像 |
| GET | /api/evaluation/history/:personaId | 获取评估历史 |
| GET | /api/evaluation/statistics/:projectId | 获取评估统计 |

## 核心模块1. LLM 服务模块

```
设计

### src/
├── services/
│   ├── llmService.js      # LLM服务基类
│   ├── openaiAdapter.js   # OpenAI适配器
│   ├── ernieAdapter.js   # 文心一言适配器
│   └── glmAdapter.js     # 智谱GLM适配器
```

**设计原则**:
- 适配器模式，支持多模型切换
- 统一的接口定义
- 错误处理和重试机制
- Token 统计和成本计算

### 2. Prompt 模板模块

```
src/
├── prompts/
│   ├── personaPrompt.js   # 画像生成Prompt
│   ├── evaluationPrompt.js # 评估Prompt
│   └── templates.js       # 模板配置
```

**Prompt 结构**:
- 人口统计维度: 年龄、性别、地域、职业等
- 行为特征维度: 浏览行为、购买行为、互动行为等
- 心理特征维度: 价值观、态度、偏好等
- 需求特征维度: 显性需求、隐性需求等
- 场景特征维度: 使用场景、触发场景等

### 3. 质量评估模块

```
src/
├── services/
│   └── evaluationService.js  # 评估服务
```

**评估维度**:
- 完整性: 画像字段是否完整
- 一致性: 各维度之间是否一致
- 真实性: 是否符合实际
- 可操作性: 是否具有实际指导意义

**评分公式**:
```
综合评分 = 完整性 * 0.25 + 一致性 * 0.25 + 真实性 * 0.3 + 可操作性 * 0.2
```

### 4. 前端组件结构

```
frontend/src/
├── components/
│   ├── DataInput/         # 数据输入组件
│   │   ├── FileUploader.vue
│   │   └── DataList.vue
│   ├── PersonaCard/       # 画像展示卡片
│   │   ├── PersonaBasic.vue
│   │   └── PersonaDetail.vue
│   ├── QualityGauge/      # 质量评分仪表盘
│   │   ├── ScoreChart.vue
│   │   └── RadarChart.vue
│   └── PromptEditor/     # Prompt编辑器
│       ├── TemplateSelect.vue
│       └── Preview.vue
├── views/
│   ├── Login.vue
│   ├── Register.vue
│   ├── Dashboard.vue
│   ├── ProjectList.vue
│   ├── ProjectDetail.vue
│   ├── PersonaGenerate.vue
│   ├── PersonaDetail.vue
│   └── Evaluation.vue
└── stores/
    ├── user.js
    ├── project.js
    ├── persona.js
    └── evaluation.js
```

## 工作流程

### 画像生成流程

```
用户上传数据
    │
    ▼
数据预处理（可选）
    │
    ▼
选择 Prompt 模板
    │
    ▼
构建完整 Prompt
    │
    ▼
调用 LLM API
    │
    ▼
解析 JSON 响应
    │
    ▼
保存到数据库
    │
    ▼
返回画像结果
```

### 质量评估流程

```
获取画像数据
    │
    ▼
完整性检查
    │
    ▼
一致性检查（LLM辅助）
    │
    ▼
真实性检查（规则+LLM）
    │
    ▼
可操作性评估
    │
    ▼
计算综合评分
    │
    ▼
返回评估结果
```

## 安全考虑

1. **认证**: JWT token 认证
2. **密码**: bcrypt 加密存储
3. **API**: 请求频率限制
4. **数据**: 敏感数据脱敏
5. **LLM**: 输入过滤和输出校验

## 性能优化

1. **缓存**: Redis 缓存画像结果
2. **异步**: 批量生成使用队列
3. **数据库**: 索引优化
4. **前端**: 代码分割懒加载

## 部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (负载均衡)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Backend 1 │    │ Backend 2 │    │ Backend 3 │
     │  (Node)  │    │  (Node)  │    │  (Node)  │
     └─────┬────┘    └─────┬────┘    └─────┬────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  MySQL   │    │  Redis   │    │  LLM API │
     └──────────┘    └──────────┘    └──────────┘
```
