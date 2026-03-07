# 用户认证 API 文档

## 基础信息

- 基础URL: `http://localhost:3000/api/users`
- 认证方式: JWT Bearer Token

## 响应格式

所有响应都遵循以下格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

错误响应：

```json
{
  "success": false,
  "message": "错误信息",
  "errors": [ ... ] // 可选的验证错误列表
}
```

---

## 公开接口

### 1. 用户注册

**POST** `/api/users/register`

注册新用户账号。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，3-50个字符，只能包含字母、数字和下划线 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，6-100个字符 |
| nickname | string | 否 | 昵称，不超过50个字符 |

**请求示例：**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "123456",
  "nickname": "约翰"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "约翰",
      "role": "user",
      "status": "active",
      "created_at": "2026-03-07T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. 用户登录

**POST** `/api/users/login`

用户登录系统。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**请求示例：**

```json
{
  "username": "john_doe",
  "password": "123456"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "约翰",
      "role": "user",
      "status": "active",
      "last_login_at": "2026-03-07T10:05:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 需要认证的接口

以下接口需要在请求头中携带 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

---

### 3. 获取当前用户信息

**GET** `/api/users/me`

获取已登录用户的详细信息。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "约翰",
      "avatar": null,
      "role": "user",
      "status": "active",
      "last_login_at": "2026-03-07T10:05:00.000Z",
      "created_at": "2026-03-07T10:00:00.000Z"
    }
  }
}
```

---

### 4. 更新当前用户信息

**PUT** `/api/users/me`

更新已登录用户的资料。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 昵称，不超过50个字符 |
| avatar | string | 否 | 头像URL |

**请求示例：**

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/avatar.jpg"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "新昵称",
      "avatar": "https://example.com/avatar.jpg",
      "role": "user",
      "status": "active"
    }
  }
}
```

---

### 5. 修改密码

**PUT** `/api/users/me/password`

修改当前用户的密码。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码，6-100个字符 |

**请求示例：**

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "密码修改成功，请重新登录"
}
```

---

## 管理员接口

以下接口需要管理员权限 (`role: admin`)。

### 6. 获取所有用户

**GET** `/api/users`

获取用户列表（分页）。

**查询参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| page | number | 页码，默认1 |
| limit | number | 每页数量，默认10 |
| status | string | 筛选状态 (active/inactive/banned) |
| role | string | 筛选角色 (user/admin) |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "role": "user",
        "status": "active"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### 7. 获取指定用户

**GET** `/api/users/:id`

根据ID获取用户详情。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "约翰",
      "role": "user",
      "status": "active"
    }
  }
}
```

---

### 8. 更新指定用户

**PUT** `/api/users/:id`

管理员更新用户信息。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像URL |
| role | string | 否 | 角色 (user/admin) |
| status | string | 否 | 状态 (active/inactive/banned) |

---

### 9. 删除用户

**DELETE** `/api/users/:id`

删除指定用户（软删除）。

**响应示例：**

```json
{
  "success": true,
  "message": "用户已删除"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未提供认证令牌或令牌无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 状态码说明

| 状态 | 说明 |
|------|------|
| active | 正常状态 |
| inactive | 未激活 |
| banned | 已封禁 |
