#!/bin/bash

# ============================================================
# 上下文管理脚本
# 用于在任务完成后更新 context.json
# 保持每次迭代的轻量级上下文
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTEXT_FILE="$SCRIPT_DIR/context.json"
TASK_FILE="$SCRIPT_DIR/task.json"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 显示帮助
show_help() {
    echo "用法: $0 <command> [options]"
    echo ""
    echo "命令:"
    echo "  start-task <task_id>     开始一个新任务"
    echo "  complete-task <task_id>  完成当前任务"
    echo "  fail-task <task_id>      标记任务失败"
    echo "  show                     显示当前上下文状态"
    echo "  init                     初始化上下文文件"
    echo ""
    exit 0
}

# 检查 context.json 是否存在
check_context() {
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo -e "${YELLOW}context.json 不存在，正在创建...${NC}"
        init_context
    fi
}

# 初始化上下文
init_context() {
    cat > "$CONTEXT_FILE" << 'EOF'
{
  "version": "1.0",
  "project": "用户画像语义模型开发",
  "created_at": "",
  "last_updated": "",

  "session": {
    "current_task_id": null,
    "total_tasks": 31,
    "completed_tasks": [],
    "failed_tasks": [],
    "iteration": 0
  },

  "project_state": {
    "initialized": false,
    "backend_ready": false,
    "frontend_ready": false,
    "database_ready": false,
    "llm_configured": false
  },

  "latest_commits": [],

  "current_task": null,

  "notes": "每次任务完成后更新此文件，用于保持轻量级上下文"
}
EOF

    # 设置时间戳
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    update_json ".created_at" "$timestamp"
    update_json ".last_updated" "$timestamp"

    echo -e "${GREEN}✓ 上下文已初始化${NC}"
}

# 使用 node 更新 JSON（更安全）
update_json() {
    local key="$1"
    local value="$2"
    local is_string="${3:-true}"

    if [ "$is_string" = "true" ]; then
        value="\"$value\""
    fi

    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$CONTEXT_FILE', 'utf8'));
        const keyPath = '$key'.replace(/^\./, '').split('.');
        let obj = data;
        for (let i = 0; i < keyPath.length - 1; i++) {
            obj = obj[keyPath[i]];
        }
        obj[keyPath[keyPath.length - 1]] = $value;
        fs.writeFileSync('$CONTEXT_FILE', JSON.stringify(data, null, 2));
    "
}

# 获取下一个待完成任务
get_next_task() {
    node -e "
        const fs = require('fs');
        const tasks = JSON.parse(fs.readFileSync('$TASK_FILE', 'utf8'));
        const pending = tasks.filter(t => !t.passes);
        if (pending.length > 0) {
            console.log(JSON.stringify(pending[0]));
        } else {
            console.log('null');
        }
    "
}

# 开始任务
start_task() {
    local task_id="$1"
    check_context

    # 获取任务信息
    local task_info=$(node -e "
        const fs = require('fs');
        const tasks = JSON.parse(fs.readFileSync('$TASK_FILE', 'utf8'));
        const task = tasks.find(t => t.id === '$task_id');
        if (task) {
            console.log(JSON.stringify(task));
        }
    ")

    if [ -z "$task_info" ] || [ "$task_info" = "null" ]; then
        echo -e "${YELLOW}任务 $task_id 不存在${NC}"
        return 1
    fi

    # 更新上下文
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    update_json ".session.current_task_id" "$task_id" "false"
    update_json ".current_task" "$task_info"
    update_json ".last_updated" "$timestamp"

    echo -e "${GREEN}✓ 开始任务: $task_id${NC}"
    echo "$task_info" | node -e "
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.on('close', () => process.exit(0));
        let data = '';
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => {
            const task = JSON.parse(data);
            console.log('  标题:', task.title);
            console.log('  描述:', task.description);
            console.log('  步骤数:', task.steps.length);
        });
    "
}

# 完成任务
complete_task() {
    local task_id="$1"
    check_context

    # 更新 session
    local completed=$(node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$CONTEXT_FILE', 'utf8'));
        const list = data.session.completed_tasks;
        if (!list.includes('$task_id')) {
            list.push('$task_id');
        }
        data.session.current_task_id = null;
        data.current_task = null;
        fs.writeFileSync('$CONTEXT_FILE', JSON.stringify(data, null, 2));
        console.log(list.join(','));
    ")

    # 更新 latest_commits
    local latest_commit=$(cd "$SCRIPT_DIR" && git log -1 --oneline 2>/dev/null | head -1)
    if [ -n "$latest_commit" ]; then
        node -e "
            const fs = require('fs');
            const data = JSON.parse(fs.readFileSync('$CONTEXT_FILE', 'utf8'));
            data.latest_commits.unshift('$latest_commit');
            data.latest_commits = data.latest_commits.slice(0, 5); // 保留最近5个
            fs.writeFileSync('$CONTEXT_FILE', JSON.stringify(data, null, 2));
        "
    fi

    # 更新时间戳
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    update_json ".last_updated" "$timestamp"

    echo -e "${GREEN}✓ 任务已完成: $task_id${NC}"
    echo -e "${GREEN}✓ 已完成任务: $completed${NC}"
}

# 标记任务失败
fail_task() {
    local task_id="$1"
    check_context

    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$CONTEXT_FILE', 'utf8'));
        if (!data.session.failed_tasks.includes('$task_id')) {
            data.session.failed_tasks.push('$task_id');
        }
        data.session.current_task_id = null;
        data.current_task = null;
        fs.writeFileSync('$CONTEXT_FILE', JSON.stringify(data, null, 2));
    "

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    update_json ".last_updated" "$timestamp"

    echo -e "${YELLOW}⚠ 任务失败: $task_id${NC}"
}

# 显示状态
show_status() {
    check_context

    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$CONTEXT_FILE', 'utf8'));

        console.log('═══════════════════════════════════════');
        console.log('         上下文状态');
        console.log('═══════════════════════════════════════');
        console.log('项目:', data.project);
        console.log('版本:', data.version);
        console.log('最后更新:', data.last_updated);
        console.log('');
        console.log('会话状态:');
        console.log('  当前任务:', data.session.current_task_id || '无');
        console.log('  迭代次数:', data.session.iteration);
        console.log('  已完成:', data.session.completed_tasks.length + '/' + data.session.total_tasks);
        console.log('  已失败:', data.session.failed_tasks.length);
        console.log('');

        if (data.session.completed_tasks.length > 0) {
            console.log('已完成任务:', data.session.completed_tasks.join(', '));
        }
        if (data.session.failed_tasks.length > 0) {
            console.log('失败任务:', data.session.failed_tasks.join(', '));
        }

        console.log('');
        console.log('项目状态:');
        console.log('  初始化:', data.project_state.initialized ? '✓' : '✗');
        console.log('  后端就绪:', data.project_state.backend_ready ? '✓' : '✗');
        console.log('  前端就绪:', data.project_state.frontend_ready ? '✓' : '✗');
        console.log('  数据库就绪:', data.project_state.database_ready ? '✓' : '✗');
        console.log('  LLM已配置:', data.project_state.llm_configured ? '✓' : '✗');

        if (data.latest_commits.length > 0) {
            console.log('');
            console.log('最近提交:');
            data.latest_commits.forEach(c => console.log('  ', c));
        }
        console.log('═══════════════════════════════════════');
    "
}

# 主函数
main() {
    local command="$1"

    case "$command" in
        start-task)
            if [ -z "$2" ]; then
                echo "错误: 请指定任务ID"
                show_help
            fi
            start_task "$2"
            ;;
        complete-task)
            if [ -z "$2" ]; then
                echo "错误: 请指定任务ID"
                show_help
            fi
            complete_task "$2"
            ;;
        fail-task)
            if [ -z "$2" ]; then
                echo "错误: 请指定任务ID"
                show_help
            fi
            fail_task "$2"
            ;;
        show)
            show_status
            ;;
        init)
            init_context
            ;;
        *)
            show_help
            ;;
    esac
}

main "$@"
