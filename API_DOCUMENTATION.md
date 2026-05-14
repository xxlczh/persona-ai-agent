# API 文档 (API Documentation)

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **所有请求** 需要在 Header 中包含 `Authorization: Bearer <token>`

## 通用响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误描述",
  "errors": [...]
}
```

---

## 认证相关 /api/users

### 注册
```
POST /api/users/register
Body: { "username": "xxx", "email": "xxx", "password": "xxx" }
```

### 登录
```
POST /api/users/login
Body: { "email": "xxx", "password": "xxx" }
Response: { "token": "xxx", "user": { "id": 1, "username": "xxx" } }
```

### 获取当前用户
```
GET /api/users/me
```

### 更新个人资料
```
PUT /api/users/me
Body: { "nickname": "xxx", "avatar": "xxx" }
```

### 修改密码
```
PUT /api/users/me/password
Body: { "oldPassword": "xxx", "newPassword": "xxx" }
```

---

## 项目管理 /api/projects

### 创建项目
```
POST /api/projects
Body: {
  "name": "项目名称",
  "description": "项目描述",
  "settings": { "mode": "simple" | "precise" | "hybrid" },
  "tags": ["标签1", "标签2"]
}
Response: {
  "project": {
    "id": 1,
    "name": "项目名称",
    "invite_code": "ABC12345"
  }
}
```

### 获取项目列表
```
GET /api/projects?filter=all|my|joined&page=1&limit=10
```

### 获取项目详情
```
GET /api/projects/:id
```

### 更新项目
```
PUT /api/projects/:id
Body: { "name": "新名称", "description": "新描述" }
```

### 删除项目（软删除）
```
DELETE /api/projects/:id
```

### 归档项目
```
POST /api/projects/:id/archive
```

### 解除归档
```
POST /api/projects/:id/unarchive
```

### 通过邀请码加入项目
```
POST /api/projects/join
Body: { "inviteCode": "ABC12345" }
```

### 获取项目邀请码
```
GET /api/projects/:id/invite-code
```

### 退出项目
```
DELETE /api/projects/:id/leave
```

### 移除项目成员（管理员）
```
DELETE /api/projects/:id/members/:userId
```

---

## 团队协作 /api/teams

### 创建团队
```
POST /api/teams
Body: { "name": "团队名称", "description": "团队描述", "projectId": 1 }
```

### 获取我的团队列表
```
GET /api/teams/my
```

### 获取团队详情
```
GET /api/teams/:id
```

### 通过邀请码加入团队
```
POST /api/teams/join
Body: { "inviteCode": "ABC12345" }
```

### 更新团队
```
PUT /api/teams/:id
Body: { "name": "新名称", "description": "新描述" }
```

### 删除团队
```
DELETE /api/teams/:id
```

### 移除团队成员
```
DELETE /api/teams/:id/members/:userId
```

### 更新成员角色
```
PUT /api/teams/:id/members/:userId/role
Body: { "role": "admin" | "member" }
```

### 离开团队
```
POST /api/teams/:id/leave
```

### 检查项目访问权限
```
GET /api/teams/check-access/:projectId
```

### 分配项目给团队
```
POST /api/teams/assign-project
Body: { "teamId": 1, "projectId": 1 }
```

---

## 数据源管理 /api/datasources

### 上传数据源
```
POST /api/datasources
Content-Type: multipart/form-data
Fields: file (文件), project_id (项目ID), name (名称可选)
```

### 获取数据源列表
```
GET /api/datasources?project_id=1&page=1&limit=10
```

### 获取数据源详情
```
GET /api/datasources/:id
```

### 更新数据源
```
PUT /api/datasources/:id
Body: { "name": "新名称", "status": "completed" }
```

### 删除数据源
```
DELETE /api/datasources/:id
```

---

## 画像生成 /api/persona

### 生成画像（精准/混合模式）
```
POST /api/persona/generate
Body: {
  "projectId": 1,
  "dataSourceIds": [1, 2],
  "useIndustryData": true
}
```

### 自然语言生成（极简模式）
```
POST /api/persona/generate-from-natural-language
Body: {
  "projectId": 1,
  "description": "Steam独立游戏玩家，25-35岁"
}
```

### 批量生成
```
POST /api/persona/batch-generate
Body: {
  "projectId": 1,
  "dataSourceIds": [1, 2],
  "batchSize": 10
}
```

### 获取批量进度
```
GET /api/persona/batch/:batchId
```

### 获取批量结果
```
GET /api/persona/batch/:batchId/results
```

### 获取画像列表
```
GET /api/persona/list?projectId=1&page=1&limit=10
```

### 获取画像详情
```
GET /api/persona/:id
```

### 更新画像
```
PUT /api/persona/:id
Body: { "name": "新名称", "summary": "新摘要" }
```

### 删除画像
```
DELETE /api/persona/:id
```

### 导出画像
```
POST /api/persona/:id/export
Body: { "format": "json" | "markdown" | "pdf" }
```

---

## 质量评估 /api/evaluation

### 评估画像
```
POST /api/evaluation/persona/:id
```

### 获取评估历史
```
GET /api/evaluation/history/:personaId
```

### 获取项目统计
```
GET /api/evaluation/statistics/:projectId
```

---

## 用研问卷 /api/surveys

### 生成问卷
```
POST /api/surveys/generate
Body: {
  "projectId": 1,
  "personaId": 1,
  "targetAudience": "目标人群描述"
}
```

### 获取项目问卷列表
```
GET /api/surveys/project/:projectId
```

### 获取问卷详情
```
GET /api/surveys/:id
```

### 更新问卷
```
PUT /api/surveys/:id
Body: { "name": "新名称", "questions": [...] }
```

### 删除问卷
```
DELETE /api/surveys/:id
```

### 导出问卷
```
GET /api/surveys/:id/export
```

---

## 营销脚本 /api/marketing-scripts

### 生成脚本
```
POST /api/marketing-scripts/generate
Body: {
  "projectId": 1,
  "personaId": 1,
  "type": "种草" | "测评" | "口播" | "短视频"
}
```

### 获取项目脚本列表
```
GET /api/marketing-scripts/project/:projectId
```

### 获取脚本详情
```
GET /api/marketing-scripts/:id
```

### 更新脚本
```
PUT /api/marketing-scripts/:id
Body: { "content": {...} }
```

### 删除脚本
```
DELETE /api/marketing-scripts/:id
```

### 导出脚本
```
GET /api/marketing-scripts/:id/export
```

---

## 产品建议 /api/product-suggestions

### 生成建议
```
POST /api/product-suggestions/generate
Body: {
  "projectId": 1,
  "personaId": 1
}
```

### 获取项目建议列表
```
GET /api/product-suggestions/project/:projectId
```

### 获取建议详情
```
GET /api/product-suggestions/:id
```

### 更新建议
```
PUT /api/product-suggestions/:id
Body: { "name": "新名称", "suggestions": [...] }
```

### 删除建议
```
DELETE /api/product-suggestions/:id
```

### 导出建议
```
GET /api/product-suggestions/:id/export
```

---

## 作品广场 /api/gallery

### 获取作品列表
```
GET /api/gallery?type=all|persona|survey|script|suggestion&page=1&limit=20
```

### 获取作品详情
```
GET /api/gallery/:type/:id
```

---

## 分享 /api/shares

### 分享内容
```
POST /api/shares
Body: {
  "resource_type": "persona" | "survey" | "script" | "suggestion",
  "resource_id": 1
}
```

### 取消分享
```
DELETE /api/shares/:type/:id
```

### 获取我的分享
```
GET /api/shares/my
```

### 检查分享状态
```
GET /api/shares/check/:type/:id
```

---

## 健康检查

### 服务器健康
```
GET /api/health
Response: { "success": true, "message": "Health check successful" }
```