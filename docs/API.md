# API 文档

## 基础信息

- 基础 URL: `http://localhost:3000/api`
- 认证方式: JWT Token (Bearer Token)
- 请求格式: JSON
- 响应格式: JSON

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

## 认证接口

### 用户注册

**POST** `/users/register`

请求体:

```json
{
  "username": "用户名",
  "email": "user@example.com",
  "password": "密码"
}
```

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "user@example.com"
  },
  "token": "jwt_token"
}
```

### 用户登录

**POST** `/users/login`

请求体:

```json
{
  "email": "user@example.com",
  "password": "密码"
}
```

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "user@example.com"
  },
  "token": "jwt_token"
}
```

### 获取当前用户信息

**GET** `/users/me`

需要认证: 是

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新当前用户信息

**PUT** `/users/me`

需要认证: 是

请求体:

```json
{
  "username": "新用户名",
  "email": "newemail@example.com"
}
```

### 修改密码

**PUT** `/users/me/password`

需要认证: 是

请求体:

```json
{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

---

## 项目接口

### 创建项目

**POST** `/projects`

需要认证: 是

请求体:

```json
{
  "name": "项目名称",
  "description": "项目描述",
  "llm_provider": "openai"
}
```

`llm_provider` 可选值: `openai`, `ernie`, `zhipu`

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目名称",
    "description": "项目描述",
    "llm_provider": "openai",
    "user_id": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取项目列表

**GET** `/projects`

需要认证: 是

查询参数:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)

响应:

```json
{
  "success": true,
  "data": {
    "projects": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 获取项目详情

**GET** `/projects/:id`

需要认证: 是

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目名称",
    "description": "项目描述",
    "llm_provider": "openai",
    "user_id": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新项目

**PUT** `/projects/:id`

需要认证: 是

请求体:

```json
{
  "name": "新项目名称",
  "description": "新项目描述",
  "llm_provider": "ernie"
}
```

### 删除项目

**DELETE** `/projects/:id`

需要认证: 是

### 归档项目

**POST** `/projects/:id/archive`

需要认证: 是

---

## 数据源接口

### 上传数据

**POST** `/datasources`

需要认证: 是

Content-Type: `multipart/form-data`

表单字段:
- `file`: 文件 (可选)
- `name`: 数据名称
- `type`: 数据类型
- `project_id`: 项目 ID
- `content`: 数据内容 (文本类型时使用)

`type` 可选值: `json`, `csv`, `text`, `pdf`

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "数据名称",
    "type": "json",
    "project_id": 1,
    "content": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取数据源列表

**GET** `/datasources`

需要认证: 是

查询参数:
- `project_id`: 项目 ID (必需)

### 获取数据源详情

**GET** `/datasources/:id`

需要认证: 是

### 更新数据源

**PUT** `/datasources/:id`

需要认证: 是

请求体:

```json
{
  "name": "新数据名称",
  "content": "新内容"
}
```

### 删除数据源

**DELETE** `/datasources/:id`

需要认证: 是

---

## 画像生成接口

### 生成画像

**POST** `/persona/generate`

需要认证: 是

请求体:

```json
{
  "project_id": 1,
  "source_data_id": 1,
  "template_id": 1,
  "options": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

响应:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "用户画像",
    "project_id": 1,
    "source_data_id": 1,
    "demographic": {
      "age": "25-35岁",
      "gender": "女性",
      "location": "一线城市",
      "occupation": "互联网从业者"
    },
    "behavioral": {
      "online_behavior": "高频使用社交媒体",
      "purchase_behavior": "注重品质",
      "interaction_preference": "喜欢互动分享"
    },
    "psychological": {
      "values": "追求品质生活",
      "attitudes": "开放包容",
      "preferences": "偏好简约设计"
    },
    "needs": {
      "explicit": "需要高效的工具",
      "implicit": "追求归属感"
    },
    "scenarios": {
      "usage_scenarios": ["工作", "生活"],
      "trigger_scenarios": ["促销活动", "朋友推荐"]
    },
    "evaluation_score": 85.5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 批量生成画像

**POST** `/persona/batch-generate`

需要认证: 是

请求体:

```json
{
  "project_id": 1,
  "source_data_ids": [1, 2, 3],
  "template_id": 1,
  "options": {
    "temperature": 0.7
  }
}
```

响应:

```json
{
  "success": true,
  "data": {
    "batch_id": "uuid-batch-id",
    "status": "processing",
    "total": 3,
    "completed": 0
  }
}
```

### 获取批量任务状态

**GET** `/persona/batch/:batchId`

### 获取批量任务结果

**GET** `/persona/batch/:batchId/results`

### 获取批量任务列表

**GET** `/persona/batches`

查询参数:
- `project_id`: 项目 ID

### 取消批量任务

**DELETE** `/persona/batch/:batchId`

### 获取画像列表

**GET** `/persona/list`

需要认证: 是

查询参数:
- `project_id`: 项目 ID (必需)
- `page`: 页码
- `limit`: 每页数量

### 获取画像详情

**GET** `/persona/:id`

需要认证: 是

### 更新画像

**PUT** `/persona/:id`

需要认证: 是

请求体:

```json
{
  "name": "新画像名称",
  "demographic": {...},
  "behavioral": {...},
  "psychological": {...},
  "needs": {...},
  "scenarios": {...}
}
```

### 删除画像

**DELETE** `/persona/:id`

需要认证: 是

### 导出画像

**POST** `/persona/:id/export`

需要认证: 是

请求体:

```json
{
  "format": "json"
}
```

`format` 可选值: `json`, `pdf`

---

## 质量评估接口

### 评估画像

**POST** `/evaluation/persona/:id`

需要认证: 是

响应:

```json
{
  "success": true,
  "data": {
    "persona_id": 1,
    "overall_score": 85.5,
    "dimensions": {
      "completeness": {
        "score": 90,
        "details": "画像字段完整度较高"
      },
      "consistency": {
        "score": 85,
        "details": "各维度之间一致性良好"
      },
      "authenticity": {
        "score": 80,
        "details": "符合实际用户特征"
      },
      "actionability": {
        "score": 87,
        "details": "具有较强的指导意义"
      }
    },
    "suggestions": [
      "建议补充更多行为数据"
    ],
    "evaluatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取评估历史

**GET** `/evaluation/history/:personaId`

需要认证: 是

### 获取评估统计

**GET** `/evaluation/statistics/:projectId`

需要认证: 是

响应:

```json
{
  "success": true,
  "data": {
    "total_personas": 50,
    "average_score": 82.5,
    "dimension_averages": {
      "completeness": 88,
      "consistency": 80,
      "authenticity": 82,
      "actionability": 80
    },
    "score_distribution": {
      "90-100": 10,
      "80-90": 25,
      "70-80": 10,
      "below_70": 5
    }
  }
}
```

---

## Prompt 模板接口

### 获取模板列表

**GET** `/prompt-templates`

响应:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "默认模板",
      "category": "general",
      "content": "...",
      "is_default": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 获取模板分类

**GET** `/prompt-templates/categories`

### 获取模板详情

**GET** `/prompt-templates/:id`

### 创建模板

**POST** `/prompt-templates`

需要认证: 是

请求体:

```json
{
  "name": "新模板",
  "category": "general",
  "content": "模板内容...",
  "description": "模板描述"
}
```

### 更新模板

**PUT** `/prompt-templates/:id`

需要认证: 是

### 删除模板

**DELETE** `/prompt-templates/:id`

需要认证: 是

### 预览模板

**POST** `/prompt-templates/:id/preview`

请求体:

```json
{
  "source_data": {...}
}
```

### 测试模板

**POST** `/prompt-templates/:id/test`

需要认证: 是

请求体:

```json
{
  "source_data": {...},
  "options": {
    "temperature": 0.7
  }
}
```

### 复制模板

**POST** `/prompt-templates/:id/duplicate`

需要认证: 是

### 设置默认模板

**POST** `/prompt-templates/:id/set-default`

需要认证: 是

### 获取默认模板列表

**GET** `/prompt-templates/defaults/list`

---

## 健康检查

### 健康检查

**GET** `/health`

不需要认证

响应:

```json
{
  "success": true,
  "message": "Health check successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 错误代码

| 错误码 | 说明 |
|--------|------|
| VALIDATION_ERROR | 参数验证错误 |
| AUTH_ERROR | 认证错误 |
| FORBIDDEN | 权限不足 |
| NOT_FOUND | 资源不存在 |
| SERVER_ERROR | 服务器错误 |
| LLM_ERROR | LLM 调用错误 |
