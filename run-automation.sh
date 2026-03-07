#!/bin/bash

# ============================================================
# 用户画像语义模型开发 - 自动化循环脚本
# 用于长时间自动运行 Claude Code 进行项目开发
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认参数
MAX_ITERATIONS=1
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/automation-logs"
PERMISSION_MODE="--dangerously-skip-permissions"

# 显示使用帮助
show_help() {
    echo "用法: $0 [次数]"
    echo ""
    echo "参数:"
    echo "  次数    自动化运行的次数 (默认: 1)"
    echo ""
    echo "示例:"
    echo "  $0 10    运行10次自动化"
    echo "  $0       运行1次"
    echo ""
    exit 0
}

# 解析参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
fi

if [ -n "$1" ]; then
    MAX_ITERATIONS="$1"
fi

# 验证参数
if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]] || [ "$MAX_ITERATIONS" -lt 1 ]; then
    echo -e "${RED}错误: 次数必须是正整数${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p "$LOG_DIR"

# 日志文件
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/automation_${TIMESTAMP}.log"

# 打印带颜色的日志
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")
            echo -e "${BLUE}[${timestamp}]${NC} ${GREEN}[INFO]${NC} $message"
            echo "[${timestamp}] [INFO] $message" >> "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${BLUE}[${timestamp}]${NC} ${YELLOW}[WARN]${NC} $message"
            echo "[${timestamp}] [WARN] $message" >> "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${BLUE}[${timestamp}]${NC} ${RED}[ERROR]${NC} $message"
            echo "[${timestamp}] [ERROR] $message" >> "$LOG_FILE"
            ;;
        "RUN")
            echo -e "${BLUE}[${timestamp}]${NC} ${CYAN}[RUN]${NC} $message"
            echo "[${timestamp}] [RUN] $message" >> "$LOG_FILE"
            ;;
        "DONE")
            echo -e "${BLUE}[${timestamp}]${NC} ${GREEN}[DONE]${NC} $message"
            echo "[${timestamp}] [DONE] $message" >> "$LOG_FILE"
            ;;
    esac
}

# 检查 Claude Code 是否可用
check_claude() {
    if ! command -v claude &> /dev/null; then
        log "ERROR" "Claude Code 未安装或不在 PATH 中"
        echo "请先安装 Claude Code: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    local version=$(claude --version 2>/dev/null || echo "unknown")
    log "INFO" "Claude Code 版本: $version"
}

# 检查 task.json 是否存在
check_task_file() {
    if [ ! -f "$PROJECT_DIR/task.json" ]; then
        log "ERROR" "task.json 文件不存在: $PROJECT_DIR/task.json"
        exit 1
    fi
}

# 检查/初始化 context.json
check_context() {
    if [ ! -f "$PROJECT_DIR/context.json" ]; then
        log "INFO" "初始化 context.json..."
        cd "$PROJECT_DIR"
        # 创建初始 context.json
        node -e "
            const fs = require('fs');
            const data = {
                version: '1.0',
                project: '用户画像语义模型开发',
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                session: {
                    current_task_id: null,
                    total_tasks: 31,
                    completed_tasks: [],
                    failed_tasks: [],
                    iteration: 0
                },
                project_state: {
                    initialized: false,
                    backend_ready: false,
                    frontend_ready: false,
                    database_ready: false,
                    llm_configured: false
                },
                latest_commits: [],
                current_task: null,
                notes: '轻量级上下文，每次迭代只读取此文件'
            };
            fs.writeFileSync('context.json', JSON.stringify(data, null, 2));
        "
        log "DONE" "context.json 已创建"
    fi
}

# 更新上下文 - 开始任务
update_context_start_task() {
    local task_id="$1"
    cd "$PROJECT_DIR"

    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('context.json', 'utf8'));
        data.session.current_task_id = '$task_id';
        data.session.iteration += 1;
        data.last_updated = new Date().toISOString();

        // 获取任务信息
        const tasks = JSON.parse(fs.readFileSync('task.json', 'utf8'));
        const task = tasks.find(t => t.id === '$task_id');
        if (task) {
            data.current_task = {
                id: task.id,
                title: task.title,
                description: task.description,
                steps: task.steps,
                started_at: new Date().toISOString()
            };
        }

        fs.writeFileSync('context.json', JSON.stringify(data, null, 2));
    "
}

# 更新上下文 - 完成任务
update_context_complete_task() {
    local task_id="$1"
    local commit_hash="$2"
    cd "$PROJECT_DIR"

    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('context.json', 'utf8'));

        // 添加到已完成列表
        if (!data.session.completed_tasks.includes('$task_id')) {
            data.session.completed_tasks.push('$task_id');
        }

        data.session.current_task_id = null;
        data.current_task = null;
        data.last_updated = new Date().toISOString();

        // 更新最近提交
        if ('$commit_hash' && '$commit_hash' !== '') {
            data.latest_commits.unshift('$commit_hash');
            data.latest_commits = data.latest_commits.slice(0, 5);
        }

        fs.writeFileSync('context.json', JSON.stringify(data, null, 2));
    "
}

# 获取下一个待完成任务 ID
get_next_task() {
    local task_id=$(cd "$PROJECT_DIR" && node -e "
        const fs = require('fs');
        const tasks = JSON.parse(fs.readFileSync('task.json', 'utf8'));
        const pending = tasks.filter(t => !t.passes);
        if (pending.length > 0) {
            console.log(pending[0].id);
        } else {
            console.log('');
        }
    ")

    if [ -z "$task_id" ]; then
        echo ""
    else
        echo "$task_id"
    fi
}

# 获取任务详情（用于直接嵌入 prompt）
get_task_details() {
    local task_id="$1"
    cd "$PROJECT_DIR"
    node -e "
        const fs = require('fs');
        const tasks = JSON.parse(fs.readFileSync('task.json', 'utf8'));
        const task = tasks.find(t => t.id === '$task_id');
        if (task) {
            console.log('任务ID: ' + task.id);
            console.log('任务标题: ' + task.title);
            console.log('任务描述: ' + task.description);
            console.log('实现步骤:');
            task.steps.forEach((step, i) => {
                console.log('  ' + (i+1) + '. ' + step);
            });
        }
    "
}

# 检查是否有未提交的更改
check_uncommitted() {
    cd "$PROJECT_DIR"
    if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
        return 1  # 没有未提交的更改
    else
        return 0  # 有未提交的更改
    fi
}

# 自动提交更改
auto_commit() {
    if ! check_uncommitted; then
        log "INFO" "没有需要提交的更改"
        return 0
    fi

    log "RUN" "自动提交更改..."

    cd "$PROJECT_DIR"

    # 获取当前进度
    local current_task=$(get_next_task)
    local task_info=""
    if [ -n "$current_task" ]; then
        task_info="任务 $current_task"
    else
        task_info="更新"
    fi

    # 添加所有更改
    git add -A

    # 获取更改的文件列表
    local changed_files=$(git diff --cached --name-only 2>/dev/null | tr '\n' ', ')

    # 提交
    git commit -m "chore: $task_info - $(date '+%Y-%m-%d %H:%M')" || true

    local commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    log "DONE" "提交完成: $commit_hash"

    return 0
}

# 自动推送到远程仓库
auto_push() {
    cd "$PROJECT_DIR"

    # 检查是否有远程仓库配置
    if ! git remote get-url origin &>/dev/null; then
        log "INFO" "没有配置远程仓库，跳过推送"
        return 0
    fi

    log "RUN" "推送到远程仓库..."

    # 推送到远程
    if git push origin master 2>&1; then
        log "DONE" "推送成功"
    else
        log "WARN" "推送失败，可能是网络问题，稍后会重试"
        return 1
    fi
}

# 记录进度
record_progress() {
    local iteration="$1"
    local status="$2"
    local task_id="$3"

    cd "$PROJECT_DIR"

    # 追加到 progress.txt
    {
        echo "========================================"
        echo "迭代 #$iteration - $(date '+%Y-%m-%d %H:%M:%S')"
                echo "状态: $status"
        if [ -n "$task_id" ]; then
            echo "任务ID: $task_id"
        fi
        echo "========================================"
    } >> "$PROJECT_DIR/progress.txt"
}

# 运行 Claude Code
run_claude() {
    local iteration="$1"

    log "RUN" "=========================================="
    log "RUN" "开始第 $iteration/$MAX_ITERATIONS 次迭代"
    log "RUN" "=========================================="

    # 检查是否还有未完成的任务
    local next_task=$(get_next_task)
    if [ -z "$next_task" ]; then
        log "INFO" "所有任务已完成！"
        log "DONE" "自动化运行完成"
        return 1  # 停止循环
    fi

    log "INFO" "下一步任务: ID=$next_task"

    # 获取任务详情
    local task_details=$(get_task_details "$next_task")

    # 更新上下文 - 标记开始任务
    update_context_start_task "$next_task"

    # 构建 prompt（包含完整任务详情，AI 无需额外读取文件）
    local INITIAL_PROMPT="你是自动化开发 Agent。请按照以下任务工作。

## 当前项目
用户画像语义模型开发

## 当前状态 (来自 context.json)
- 已完成任务: $(cd "$PROJECT_DIR" && node -e "const d=require('./context.json');console.log(d.session.completed_tasks.join(',')||'')")"
- 项目状态: $(cd "$PROJECT_DIR" && node -e "const d=require('./context.json');console.log('后端:'+d.project_state.backend_ready+',前端:'+d.project_state.frontend_ready+',数据库:'+d.project_state.database_ready+',LLM:'+d.project_state.llm_configured)")"
- 迭代次数: $(cd "$PROJECT_DIR" && node -e "const d=require('./context.json');console.log(d.session.iteration)")"

## 本次任务详情
$task_details

## 工作流程 (来自 CLAUDE.md)
1. 验证之前的功能是否正常工作
2. 按照上面的\"实现步骤\"逐步完成任务
3. 测试验证
4. 更新 task.json 中任务 $next_task 的 passes 字段为 true
5. 更新 progress.txt 记录进度
6. 提交 git commit
7. 运行 \`./update-context.sh complete-task $next_task\` 更新上下文

开始工作吧！"

    # 调用 Claude Code
    # 使用 --dangerously-skip-permissions 跳过权限确认
    # 使用 -p 从 stdin 读取 prompt
    echo "$INITIAL_PROMPT" | claude $PERMISSION_MODE -p 2>&1 | tee -a "$LOG_FILE"

    local exit_code=${PIPESTATUS[0]}

    # 记录这次迭代
    record_progress "$iteration" "completed" "$next_task"

    # 尝试自动提交
    auto_commit

    # 尝试推送到远程仓库
    auto_push

    # 获取 commit hash
    local commit_hash=$(cd "$PROJECT_DIR" && git rev-parse --short HEAD 2>/dev/null || echo "")

    # 更新上下文 - 标记完成任务
    update_context_complete_task "$next_task" "$commit_hash"

    if [ $exit_code -ne 0 ]; then
        log "WARN" "Claude Code 退出码: $exit_code"
    fi

    log "DONE" "第 $iteration 次迭代完成"

    return 0
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}  用户画像语义模型 - 自动化运行${NC}"
    echo "=========================================="
    echo ""
    echo "配置:"
    echo "  迭代次数: $MAX_ITERATIONS"
    echo "  项目目录: $PROJECT_DIR"
    echo "  日志文件: $LOG_FILE"
    echo "  权限模式: $PERMISSION_MODE"
    echo ""

    # 前置检查
    check_claude
    check_task_file
    check_context  # 初始化/检查上下文

    log "INFO" "开始自动化运行..."

    # 初始化 progress.txt 如果不存在
    if [ ! -f "$PROJECT_DIR/progress.txt" ]; then
        echo "# 用户画像语义模型开发 - 进度记录" > "$PROJECT_DIR/progress.txt"
        echo "" >> "$PROJECT_DIR/progress.txt"
        log "INFO" "创建 progress.txt"
    fi

    # 运行循环
    for i in $(seq 1 $MAX_ITERATIONS); do
        run_claude $i
        local result=$?

        # 如果返回 1（没有更多任务），停止循环
        if [ $result -eq 1 ]; then
            break
        fi

        # 每次迭代之间稍作等待
        if [ $i -lt $MAX_ITERATIONS ]; then
            log "INFO" "等待 3 秒后开始下一次迭代..."
            sleep 3
        fi
    done

    log "DONE" "=========================================="
    log "DONE" "  自动化运行全部完成！"
    log "DONE" "=========================================="
    log "INFO" "日志文件: $LOG_FILE"
    log "INFO" "项目目录: $PROJECT_DIR"
    echo ""
}

# 运行主函数
main
