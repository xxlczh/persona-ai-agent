<template>
  <div class="batch-generator">
    <!-- 批量生成按钮 -->
    <div class="batch-header">
      <el-button type="primary" @click="showBatchDialog = true">
        <el-icon><Plus /></el-icon>
        批量生成
      </el-button>
    </div>

    <!-- 批量生成对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量生成画像"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- 步骤条 -->
      <el-steps :active="batchStep" finish-status="success" align-center class="batch-steps">
        <el-step title="配置任务" description="设置批量生成参数" />
        <el-step title="生成中" description="等待生成完成" />
        <el-step title="查看结果" description="查看生成结果" />
      </el-steps>

      <!-- 步骤1：配置任务 -->
      <div v-show="batchStep === 0" class="batch-step-content">
        <el-form :model="batchConfig" label-width="120px">
          <el-form-item label="任务数量">
            <el-input-number v-model="batchConfig.taskCount" :min="2" :max="50" @change="handleTaskCountChange" />
            <span class="form-tip">最多 50 个任务</span>
          </el-form-item>

          <el-form-item label="生成模式">
            <el-radio-group v-model="batchConfig.mode">
              <el-radio label="quick">快速生成</el-radio>
              <el-radio label="comprehensive">完整生成</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择数据源">
            <DataSelector
              ref="batchDataSelectorRef"
              :project-id="projectId"
              v-model:selected-sources="selectedSources"
              multiple
            />
          </el-form-item>

          <el-form-item label="每个任务数据">
            <el-switch v-model="batchConfig.splitBySource" active-text="每个数据源单独生成" inactive-text="所有数据源组合生成" />
          </el-form-item>

          <el-form-item label="模型配置">
            <el-select v-model="batchConfig.provider" placeholder="选择模型提供商">
              <el-option label="OpenAI" value="openai" />
              <el-option label="百度文心一言" value="ernie" />
              <el-option label="智谱GLM" value="zhipu" />
            </el-select>
            <el-select v-model="batchConfig.model" placeholder="选择模型" style="margin-left: 10px;">
              <el-option label="gpt-4o-mini" value="gpt-4o-mini" />
              <el-option label="gpt-4o" value="gpt-4o" />
              <el-option label="gpt-3.5-turbo" value="gpt-3.5-turbo" />
            </el-select>
          </el-form-item>

          <el-form-item label="Temperature">
            <el-slider v-model="batchConfig.temperature" :min="0" :max="1" :step="0.1" show-stops />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：生成中 -->
      <div v-show="batchStep === 1" class="batch-step-content">
        <div class="batch-progress">
          <el-progress
            :percentage="batchProgress"
            :status="batchStatus"
            :stroke-width="20"
          />
          <div class="progress-info">
            <span>已完成: {{ batchCompleted }} / {{ batchTotal }}</span>
            <span v-if="batchFailed > 0" class="failed-count">失败: {{ batchFailed }}</span>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="task-list">
          <el-table :data="taskList" max-height="300" style="width: 100%">
            <el-table-column prop="name" label="任务名称" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'pending'" type="info">等待中</el-tag>
                <el-tag v-else-if="row.status === 'running'" type="warning">处理中</el-tag>
                <el-tag v-else-if="row.status === 'completed'" type="success">已完成</el-tag>
                <el-tag v-else-if="row.status === 'failed'" type="danger">失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column prop="error" label="错误信息" />
          </el-table>
        </div>

        <div class="batch-actions">
          <el-button @click="cancelBatch">取消</el-button>
          <el-button type="primary" @click="refreshProgress" :loading="refreshing">刷新</el-button>
        </div>
      </div>

      <!-- 步骤3：查看结果 -->
      <div v-show="batchStep === 2" class="batch-step-content">
        <div class="result-summary">
          <el-result icon="success" title="批量生成完成">
            <template #sub-title>
              成功: {{ batchCompleted }} | 失败: {{ batchFailed }}
            </template>
          </el-result>
        </div>

        <div class="result-list">
          <h4>生成的画像</h4>
          <div class="persona-cards">
            <PersonaCard
              v-for="persona in generatedPersonas"
              :key="persona.id"
              :persona="persona"
              @click="viewPersona(persona)"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBatchDialog = false">关闭</el-button>
          <el-button v-if="batchStep === 0" type="primary" @click="startBatchGenerate" :disabled="!canStartBatch">
            开始批量生成
          </el-button>
          <el-button v-if="batchStep === 2" type="primary" @click="resetBatch">
            再次生成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DataSelector from './DataSelector.vue'
import PersonaCard from './PersonaCard.vue'
import { personaApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['generated'])

// 对话框控制
const showBatchDialog = ref(false)
const batchStep = ref(0)

// 批量配置
const batchConfig = ref({
  taskCount: 5,
  mode: 'quick',
  splitBySource: true,
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7
})

// 数据源选择
const batchDataSelectorRef = ref(null)
const selectedSources = ref([])

// 批量生成状态
const batchId = ref('')
const batchProgress = ref(0)
const batchStatus = ref('')
const batchTotal = ref(0)
const batchCompleted = ref(0)
const batchFailed = ref(0)
const taskList = ref([])
const generatedPersonas = ref([])
const refreshing = ref(false)

// 轮询定时器
let pollingTimer = null

// 是否可以开始批量生成
const canStartBatch = computed(() => {
  return selectedSources.value.length > 0 && batchConfig.value.taskCount > 0
})

// 任务数量变化时更新任务列表
const handleTaskCountChange = () => {
  // 这里可以根据需要初始化任务列表
}

// 开始批量生成
const startBatchGenerate = async () => {
  if (selectedSources.value.length === 0) {
    ElMessage.warning('请至少选择一个数据源')
    return
  }

  // 构建任务列表
  const tasks = []
  if (batchConfig.value.splitBySource) {
    // 每个数据源单独生成
    for (let i = 0; i < Math.min(selectedSources.value.length, batchConfig.value.taskCount); i++) {
      tasks.push({
        name: `画像${i + 1}`,
        sourceDataIds: [selectedSources.value[i].id]
      })
    }
  } else {
    // 所有数据源组合生成多个画像
    for (let i = 0; i < batchConfig.value.taskCount; i++) {
      tasks.push({
        name: `画像${i + 1}`,
        sourceDataIds: selectedSources.value.map(s => s.id)
      })
    }
  }

  try {
    const res = await personaApi.batchGenerate({
      projectId: props.projectId,
      tasks,
      config: {
        mode: batchConfig.value.mode,
        provider: batchConfig.value.provider,
        model: batchConfig.value.model,
        temperature: batchConfig.value.temperature
      }
    })

    if (res.success) {
      batchId.value = res.data.batchId
      batchTotal.value = res.data.total
      batchStep.value = 1
      startPolling()
      ElMessage.success('批量生成任务已启动')
    } else {
      throw new Error(res.message)
    }
  } catch (error) {
    ElMessage.error(error.message || '启动批量生成失败')
  }
}

// 开始轮询
const startPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
  pollingTimer = setInterval(refreshProgress, 3000)
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 刷新进度
const refreshProgress = async () => {
  if (!batchId.value) return

  refreshing.value = true
  try {
    const res = await personaApi.getBatchStatus(batchId.value)
    if (res.success) {
      const data = res.data
      batchProgress.value = data.progress
      batchTotal.value = data.total
      batchCompleted.value = data.completed
      batchFailed.value = data.failed
      taskList.value = data.tasks

      // 更新状态
      if (data.status === 'completed') {
        batchStatus.value = 'success'
        stopPolling()
        loadResults()
      } else if (data.status === 'failed') {
        batchStatus.value = 'exception'
        stopPolling()
      }
    }
  } catch (error) {
    console.error('获取进度失败:', error)
  } finally {
    refreshing.value = false
  }
}

// 加载结果
const loadResults = async () => {
  try {
    const res = await personaApi.getBatchResults(batchId.value)
    if (res.success) {
      generatedPersonas.value = res.data.results || []
      batchStep.value = 2
      emit('generated', generatedPersonas.value)
    }
  } catch (error) {
    console.error('加载结果失败:', error)
  }
}

// 取消批量生成
const cancelBatch = async () => {
  if (!batchId.value) return

  try {
    await personaApi.cancelBatch(batchId.value)
    stopPolling()
    ElMessage.info('已取消批量生成')
    showBatchDialog.value = false
  } catch (error) {
    ElMessage.error('取消失败')
  }
}

// 查看画像
const viewPersona = (persona) => {
  emit('view', persona)
}

// 重置批量生成
const resetBatch = () => {
  batchStep.value = 0
  batchId.value = ''
  batchProgress.value = 0
  batchTotal.value = 0
  batchCompleted.value = 0
  batchFailed.value = 0
  taskList.value = []
  generatedPersonas.value = []
  selectedSources.value = []
}

// 监听对话框关闭
watch(showBatchDialog, (val) => {
  if (!val) {
    stopPolling()
    resetBatch()
  }
})
</script>

<style scoped>
.batch-header {
  margin-bottom: 16px;
}

.batch-steps {
  margin-bottom: 24px;
}

.batch-step-content {
  min-height: 300px;
}

.form-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.batch-progress {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
}

.failed-count {
  color: #f56c6c;
}

.task-list {
  margin-top: 20px;
}

.batch-actions {
  margin-top: 20px;
  text-align: center;
}

.result-summary {
  margin-bottom: 20px;
}

.result-list h4 {
  margin-bottom: 12px;
}

.persona-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.dialog-footer {
  text-align: right;
}
</style>
