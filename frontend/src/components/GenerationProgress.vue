<template>
  <div class="generation-progress">
    <!-- 等待生成状态 -->
    <div v-if="status === 'pending'" class="waiting-state">
      <el-empty description="等待开始生成">
        <el-button type="primary" @click="handleStartGenerate">
          开始生成
        </el-button>
      </el-empty>
    </div>

    <!-- 生成中状态 -->
    <div v-else-if="status === 'generating'" class="generating-state">
      <div class="progress-card">
        <div class="progress-header">
          <h4>正在生成用户画像</h4>
          <el-tag type="warning">生成中</el-tag>
        </div>

        <!-- 总体进度 -->
        <div class="overall-progress">
          <el-progress
            :percentage="progress"
            :stroke-width="20"
            :format="formatPercentage"
          />
        </div>

        <!-- 步骤列表 -->
        <div class="steps-container">
          <el-steps :active="currentStep" finish-status="wait" align-center>
            <el-step
              v-for="(step, index) in steps"
              :key="index"
              :title="step.title"
              :description="step.description"
            />
          </el-steps>
        </div>

        <!-- 当前步骤详情 -->
        <div v-if="currentStepInfo" class="current-step-detail">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>{{ currentStepInfo.description }}</span>
        </div>

        <!-- 日志输出 -->
        <div v-if="logs.length > 0" class="log-container">
          <div class="log-header">
            <span>生成日志</span>
            <el-button size="small" text @click="clearLogs">清除</el-button>
          </div>
          <div class="log-content" ref="logContainerRef">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>

        <!-- 取消按钮 -->
        <div class="action-buttons">
          <el-button @click="handleCancel" :loading="canceling">取消生成</el-button>
        </div>
      </div>
    </div>

    <!-- 成功状态 -->
    <div v-else-if="status === 'success'" class="success-state">
      <el-result
        icon="success"
        title="生成成功"
        sub-title="用户画像已成功生成"
      >
        <template #extra>
          <el-button type="primary" @click="handleViewResult">查看结果</el-button>
          <el-button @click="handleReset">重新生成</el-button>
        </template>
      </el-result>
    </div>

    <!-- 失败状态 -->
    <div v-else-if="status === 'error'" class="error-state">
      <el-result
        icon="error"
        title="生成失败"
        :sub-title="errorMessage || '画像生成过程中出现错误'"
      >
        <template #extra>
          <el-button type="primary" @click="handleRetry">重试</el-button>
          <el-button @click="handleReset">重新配置</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  // pending | generating | success | error
  status: {
    type: String,
    default: 'pending'
  },
  // 0-100
  progress: {
    type: Number,
    default: 0
  },
  // 当前步骤索引
  currentStep: {
    type: Number,
    default: 0
  },
  // 错误信息
  errorMessage: {
    type: String,
    default: ''
  },
  // 日志
  logs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['start', 'cancel', 'view-result', 'retry', 'reset'])

const logContainerRef = ref(null)
const canceling = ref(false)

// 步骤定义
const steps = [
  { title: '数据准备', description: '加载和解析数据源' },
  { title: 'Prompt 构建', description: '组装生成 Prompt' },
  { title: 'LLM 调用', description: '调用大语言模型生成' },
  { title: '结果解析', description: '解析和结构化输出' },
  { title: '存储结果', description: '保存到数据库' }
]

// 当前步骤信息
const currentStepInfo = computed(() => {
  if (props.status !== 'generating') return null
  return steps[props.currentStep] || null
})

// 格式化百分比
const formatPercentage = (percentage) => {
  return `${percentage}%`
}

// 自动滚动日志
watch(() => props.logs, () => {
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  })
}, { deep: true })

// 开始生成
const handleStartGenerate = () => {
  emit('start')
}

// 取消生成
const handleCancel = async () => {
  canceling.value = true
  emit('cancel')
  setTimeout(() => {
    canceling.value = false
  }, 1000)
}

// 查看结果
const handleViewResult = () => {
  emit('view-result')
}

// 重试
const handleRetry = () => {
  emit('retry')
}

// 重置
const handleReset = () => {
  emit('reset')
}

// 清除日志
const clearLogs = () => {
  // 日志由父组件管理，这里只触发清除事件
}
</script>

<style scoped>
.generation-progress {
  padding: 20px;
}

.waiting-state {
  padding: 60px 0;
}

.generating-state .progress-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.progress-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.overall-progress {
  margin-bottom: 32px;
}

.steps-container {
  margin-bottom: 24px;
  padding: 0 20px;
}

.current-step-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 24px;
  color: #606266;
}

.loading-icon {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.log-container {
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  display: flex;
  gap: 12px;
}

.log-time {
  color: #858585;
  flex-shrink: 0;
}

.log-message {
  word-break: break-all;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.success-state,
.error-state {
  padding: 40px 0;
}
</style>
