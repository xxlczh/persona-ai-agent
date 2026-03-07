# 用户画像语义模型开发 - Agent工作流程

## 项目概述

基于LLM的用户画像智能生成系统，通过输入用户相关数据（人口统计、行为数据、原始文本等），利用大语言模型生成结构化用户画像，并提供多维度质量评估。

## 技术栈

- **前端**: Vue 3 + Element Plus + Vite
- **后端**: Node.js + Express + Sequelize
- **数据库**: MySQL + Redis
- **AI**: OpenAI API / 百度文心一言 / 智谱GLM

---

## MANDATORY: Agent Workflow

### Step 1: 初始化环境 (必须)

```bash
# 1. 检查当前项目状态
pwd
ls -la
cat task.json | head -30
cat progress.txt 2>/dev/null || echo "No progress yet"
git log --oneline -10 2>/dev/null || echo "No git history"
```

```bash
# 2. 启动环境服务
./init.sh
```

如果 init.sh 执行失败，立即停止并报告错误。

### Step 2: 选择任务 (必须)

1. 读取 `task.json`
2. 找到 `passes: false` 的任务
3. 选择**最高优先级**（id最小的未完成任务）的任务
4. 阅读任务描述和 steps

### Step 3: 验证现有功能 (关键!)

在开始新任务之前，必须验证之前的功能仍然正常工作：

- 后端API: `curl http://localhost:3000/api/health` 或类似
- 前端页面: 打开浏览器检查
- 运行测试: `npm run test` 或 `npm run lint`

如果发现问题：
1. 标记相关任务的 passes 为 false
2. 修复问题
3. 验证修复成功
4. 然后继续新任务

### Step 4: 实现任务

按照 task.json 中任务的 steps 逐步实现：

1. 创建/修改代码文件
2. 确保代码符合项目规范
3. 不要跳过一个步骤

### Step 5: 测试验证

**大幅修改** (页面、UI、组件):
- 必须使用浏览器测试
- 启动开发服务器: `npm run dev`
- 使用 Playwright 或手动验证
- 截图保存到 `tests/screenshots/`

**小幅修改** (API、逻辑、配置):
- 运行 lint: `npm run lint`
- 运行 build: `npm run build`
- 运行单元测试: `npm test`

### Step 6: 更新 task.json

**严格规则**:
- ✅ 只允许修改 `passes: false` → `passes: true`
- ❌ 禁止删除任务
- ❌ 禁止修改任务描述
- ❌ 禁止修改 steps
- ❌ 禁止添加新任务

### Step 7: 更新 progress.txt

在 progress.txt 末尾追加：

```
## [时间戳] 任务 [ID]: [任务名称]

- 状态: 完成
- 提交: [commit hash]
- 备注: [简要说明]
```

### Step 8: Git提交 (必须)

```bash
# 添加所有更改
git add -A

# 提交 (包含代码 + task.json + progress.txt)
git commit -m "feat: 完成任务 [ID] [任务名称]"
```

**重要**:
- 每次会话必须至少提交一次
- 不要留下未提交的更改
- 提交信息必须描述性

### Step 9: 结束会话

在结束之前确保：
1. 所有更改已提交
2. 服务可以正常运行
3. progress.txt 已更新
4. task.json 的 passes 状态正确

---

## 阻塞处理

当遇到以下情况时，必须停止并报告：

### 阻塞场景

1. **缺少配置**: 缺少 API Key、环境变量
2. **第三方服务不可用**: LLM API 无法访问
3. **依赖安装失败**: npm install 失败
4. **数据库连接失败**: MySQL/Redis 无法连接
5. **需要人工授权**: 需要用户账号、API权限等

### 阻塞输出格式

```
🚫 任务阻塞 - 需要人工介入

当前任务: [任务ID] - [任务名称]
已完成的工作:
  - [已完成的具体工作1]
  - [已完成的具体工作2]

阻塞原因:
[具体描述]

需要人工帮助:
  1. [具体需要的帮助1]
  2. [具体需要的帮助2]

解除阻塞后请运行:
claude -p --dangerously-skip-permissions
```

### 阻塞时禁止的行为

- ❌ 执行 git commit
- ❌ 将 passes 设为 true
- ❌ 假装任务完成
- ❌ 跳过步骤

### 阻塞时的正确行为

- ✅ 详细记录 progress.txt
- ✅ 输出阻塞信息
- ✅ 停止并等待人工

---

## 项目目录结构

```
persona-ai-agent/
├── CLAUDE.md           # 本文件
├── task.json           # 任务列表
├── progress.txt        # 进度记录
├── architecture.md     # 架构文档
├── init.sh            # 环境初始化
├── run-automation.sh  # 自动化循环
│
├── backend/           # 后端代码
│   └── src/
│
├── frontend/          # 前端代码
│   └── src/
│
└── database/          # 数据库脚本
```

---

## 常用命令

```bash
# 初始化环境
./init.sh

# 启动后端
cd backend && npm run dev

# 启动前端
cd frontend && npm run dev

# 安装依赖
cd backend && npm install
cd frontend && npm install

# Lint检查
cd backend && npm run lint
cd frontend && npm run lint
```

---

## 上下文管理 (重要!)

### 为什么需要上下文管理

每次 Claude Code 启动时都应该是一个"清醒"的状态，而不是带着之前所有的对话历史。这有助于：
- 保持最佳性能和响应速度
- 避免上下文膨胀导致的"遗忘"
- 每次都是干净的开始

### 上下文文件

**context.json** - 轻量级上下文快照

每次迭代开始时，优先读取 `context.json` 而不是读取所有文件：

```bash
# 读取上下文
cat context.json
```

context.json 包含：
- 当前任务 ID
- 已完成任务列表
- 项目状态（后端/前端/数据库准备情况）
- 最近 5 次 git commit
- 迭代次数

### 上下文更新

任务完成后，必须更新上下文：

```bash
# 完成任务后更新上下文
./update-context.sh complete-task <task_id>
```

其他命令：
```bash
./update-context.sh show              # 查看当前状态
./update-context.sh start-task <id>   # 开始任务
./update-context.sh fail-task <id>    # 标记失败
```

### 工作流程中的上下文

1. **开始任务**: 读取 context.json 了解当前状态
2. **完成任务**: 运行 `./update-context.sh complete-task <id>`
3. **遇到阻塞**: 运行 `./update-context.sh fail-task <id>`

---

## 注意事项

1. **不要假设**: 所有配置、密钥需要用户提供
2. **逐步实现**: 一个任务一个任务完成
3. **测试驱动**: 实现后必须验证
4. **提交规范**: 每次重要更改都要提交
5. **记录进度**: 保持 progress.txt 更新
6. **上下文管理**: 使用 context.json 保持轻量级上下文
