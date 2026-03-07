<template>
  <div class="persona-generator">
    <!-- 步骤条 -->
    <div class="steps-wrapper">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择数据" description="选择用于生成的数据源" />
        <el-step title="配置参数" description="设置 Prompt 和模型参数" />
        <el-step title="生成画像" description="LLM 生成用户画像" />
        <el-step title="查看结果" description="查看和导出画像" />
      </el-steps>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤1：数据选择 -->
      <div v-show="currentStep === 0" class="step-panel">
        <DataSelector
          ref="dataSelectorRef"
          :project-id="projectId"
          v-model:selected-sources="selectedSources"
        />
        <div class="step-actions">
          <el-button
            type="primary"
            :disabled="selectedSources.length === 0"
            @click="goToStep(1)"
          >
            下一步
          </el-button>
        </div>
      </div>

      <!-- 步骤2：Prompt 配置 -->
      <div v-show="currentStep === 1" class="step-panel">
        <PromptConfig
          ref="promptConfigRef"
          v-model:config="promptConfig"
        />
        <div class="step-actions">
          <el-button @click="goToStep(0)">上一步</el-button>
          <el-button
            type="primary"
            :loading="generating"
            @click="startGeneration"
          >
            开始生成
          </el-button>
        </div>
      </div>

      <!-- 步骤3：生成进度 -->
      <div v-show="currentStep === 2" class="step-panel">
        <GenerationProgress
          :status="generationStatus"
          :progress="generationProgress"
          :current-step="generationStep"
          :error-message="errorMessage"
          :logs="generationLogs"
          @start="startGeneration"
          @cancel="cancelGeneration"
          @view-result="viewResult"
          @retry="startGeneration"
          @reset="resetGenerator"
        />
      </div>

      <!-- 步骤4：结果展示 -->
      <div v-show="currentStep === 3" class="step-panel">
        <ResultDisplay
          v-if="generatedPersona"
          :persona="generatedPersona"
          @export="handleExport"
          @edit="handleEdit"
          @delete="handleDelete"
          @new="resetGenerator"
        />
        <div v-else class="no-result">
          <el-empty description="暂无生成结果" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import DataSelector from './DataSelector.vue'
import PromptConfig from './PromptConfig.vue'
import GenerationProgress from './GenerationProgress.vue'
import ResultDisplay from './ResultDisplay.vue'
import { personaApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['generated'])

// 步骤控制
const currentStep = ref(0)
const dataSelectorRef = ref(null)
const promptConfigRef = ref(null)

// 数据选择
const selectedSources = ref([])

// Prompt 配置
const promptConfig = ref({
  personaName: '',
  personaType: 'typical',
  depth: 'standard',
  dimensions: ['demographic', 'behavioral', 'psychological', 'needs', 'scenario'],
  customPrompt: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7
})

// 生成状态
const generating = ref(false)
const generationStatus = ref('pending') // pending | generating | success | error
const generationProgress = ref(0)
const generationStep = ref(0)
const generationLogs = ref([])
const errorMessage = ref('')
const generatedPersona = ref(null)

// 跳转到指定步骤
const goToStep = (step) => {
  if (step === 1 && selectedSources.value.length === 0) {
    ElMessage.warning('请至少选择一个数据源')
    return
  }
  currentStep.value = step
}

// 开始生成
const startGeneration = async () => {
  // 验证表单
  if (!promptConfigRef.value) return

  const isValid = await promptConfigRef.value.validate()
  if (!isValid) {
    ElMessage.warning('请完善配置信息')
    return
  }

  if (selectedSources.value.length === 0) {
    ElMessage.warning('请至少选择一个数据源')
    return
  }

  generating.value = true
  generationStatus.value = 'generating'
  generationProgress.value = 0
  generationStep.value = 0
  generationLogs.value = []
  errorMessage.value = ''

  // 模拟生成过程
  addLog('开始生成用户画像...')

  try {
    const config = promptConfigRef.value.getConfig()

    // 构建请求数据
    const requestData = {
      projectId: props.projectId,
      sourceDataIds: selectedSources.value.map(s => s.id),
      config: {
        name: config.personaName,
        type: config.personaType,
        depth: config.depth,
        dimensions: config.dimensions,
        customPrompt: config.customPrompt,
        provider: config.provider,
        model: config.model,
        temperature: config.temperature
      }
    }

    // 调用生成 API
    const res = await personaApi.generate(requestData)

    if (res.success) {
      // 模拟进度更新
      await simulateProgress()

      generatedPersona.value = res.data
      generationStatus.value = 'success'
      generationProgress.value = 100
      generationStep.value = 4
      addLog('画像生成成功！')

      emit('generated', res.data)
      currentStep.value = 3
    } else {
      throw new Error(res.message || '生成失败')
    }
  } catch (error) {
    console.error('生成失败:', error)
    generationStatus.value = 'error'
    errorMessage.value = error.message || '生成失败，请稍后重试'
    addLog(`生成失败: ${error.message}`)
  } finally {
    generating.value = false
  }
}

// 模拟进度更新
const simulateProgress = async () => {
  const steps = [
    { progress: 20, step: 0, log: '正在加载数据源...' },
    { progress: 40, step: 1, log: '正在构建 Prompt...' },
    { progress: 60, step: 2, log: '正在调用 LLM...' },
    { progress: 80, step: 3, log: '正在解析结果...' },
    { progress: 90, step: 4, log: '正在保存...' }
  ]

  for (const item of steps) {
    await new Promise(resolve => setTimeout(resolve, 500))
    generationProgress.value = item.progress
    generationStep.value = item.step
    addLog(item.log)
  }
}

// 添加日志
const addLog = (message) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  generationLogs.value.push({ time, message })
}

// 取消生成
const cancelGeneration = () => {
  generating.value = false
  generationStatus.value = 'pending'
  addLog('已取消生成')
  ElMessage.info('已取消生成')
}

// 查看结果
const viewResult = () => {
  if (generatedPersona.value) {
    currentStep.value = 3
  }
}

// 重置生成器
const resetGenerator = () => {
  currentStep.value = 0
  selectedSources.value = []
  generationStatus.value = 'pending'
  generationProgress.value = 0
  generationStep.value = 0
  generationLogs.value = []
  errorMessage.value = ''
  generatedPersona.value = null
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 编辑
const handleEdit = (persona) => {
  ElMessage.info('编辑功能开发中')
}

// 删除
const handleDelete = async (id) => {
  try {
    const res = await personaApi.delete(id)
    if (res.success) {
      ElMessage.success('删除成功')
      resetGenerator()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.persona-generator {
  padding: 20px;
}

.steps-wrapper {
  margin-bottom: 32px;
  padding: 0 40px;
}

.step-content {
  min-height: 400px;
}

.step-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.step-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.no-result {
  padding: 60px 0;
}
</style>
