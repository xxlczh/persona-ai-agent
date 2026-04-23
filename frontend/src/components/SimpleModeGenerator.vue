<template>
  <div class="simple-mode-generator">
    <el-alert
      title="极简模式：直接通过自然语言描述生成画像"
      type="info"
      :closable="false"
      style="margin-bottom: 20px;"
    />

    <el-card v-if="!generatedPersona">
      <template #header>
        <div class="card-header">
          <span>描述您的目标用户</span>
          <el-tag size="small" type="success">极简模式</el-tag>
        </div>
      </template>

      <el-form :model="formData" label-width="120px">
        <el-form-item label="用户需求描述">
          <el-input
            v-model="formData.naturalLanguageInput"
            type="textarea"
            :rows="4"
            placeholder="用自然语言描述您想要的画像，如：20-30岁手游玩家画像，用于英雄设计"
          />
        </el-form-item>

        <el-form-item label="行业数据增强">
          <el-switch
            v-model="formData.useIndustryData"
            active-text="启用"
            inactive-text="关闭"
          />
          <div class="form-tip">启用后将结合行业通用数据提升画像准确性</div>
        </el-form-item>

        <el-form-item label="生成数量">
          <el-radio-group v-model="formData.count">
            <el-radio :label="1">单个画像</el-radio>
            <el-radio :label="3">3个画像</el-radio>
            <el-radio :label="5">5个画像</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="generating"
            @click="startGeneration"
          >
            开始生成
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 生成中状态 -->
    <div v-if="generating" class="generating-panel">
      <el-progress
        type="circle"
        :percentage="progress"
        :status="progressStatus"
      />
      <p class="generating-text">{{ currentLog }}</p>
      <div class="log-list">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 生成结果 -->
    <div v-if="generatedPersona && !generating" class="result-panel">
      <el-alert
        title="画像生成成功"
        type="success"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <ResultDisplay
        v-if="generatedPersona"
        :persona="generatedPersona"
        @export="handleExport"
        @edit="handleEdit"
        @delete="handleDelete"
        @new="resetGenerator"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ResultDisplay from './ResultDisplay.vue'
import { personaApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  },
  initialInput: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['generated'])

const formData = ref({
  naturalLanguageInput: '',
  useIndustryData: true,
  count: 1
})

const generating = ref(false)
const progress = ref(0)
const progressStatus = ref()
const currentLog = ref('正在初始化...')
const logs = ref([])
const generatedPersona = ref(null)

onMounted(() => {
  if (props.initialInput) {
    formData.value.naturalLanguageInput = props.initialInput
  }
})

const addLog = (message) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.push({ time, message })
  currentLog.value = message
}

const startGeneration = async () => {
  if (!formData.value.naturalLanguageInput.trim()) {
    ElMessage.warning('请输入用户需求描述')
    return
  }

  generating.value = true
  progress.value = 0
  logs.value = []

  try {
    addLog('正在分析自然语言输入...')
    await simulateProgress(20)
    addLog('正在构建 Prompt...')
    await simulateProgress(40)
    addLog('正在调用 LLM 生成画像...')
    await simulateProgress(70)

    // 调用生成 API
    const res = await personaApi.generateFromNaturalLanguage({
      projectId: props.projectId,
      naturalLanguageInput: formData.value.naturalLanguageInput,
      useIndustryData: formData.value.useIndustryData,
      count: formData.value.count
    })

    if (res.success) {
      addLog('画像生成成功！')
      await simulateProgress(100)
      generatedPersona.value = res.data
      emit('generated', res.data)
    } else {
      throw new Error(res.message || '生成失败')
    }
  } catch (error) {
    console.error('生成失败:', error)
    progressStatus.value = 'exception'
    addLog(`生成失败: ${error.message}`)
    ElMessage.error(error.message || '生成失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

const simulateProgress = async (target) => {
  while (progress.value < target) {
    await new Promise(resolve => setTimeout(resolve, 200))
    progress.value += Math.random() * 5
    if (progress.value > target) progress.value = target
  }
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

const handleEdit = () => {
  ElMessage.info('编辑功能开发中')
}

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

const resetGenerator = () => {
  generatedPersona.value = null
  logs.value = []
  progress.value = 0
}
</script>

<style scoped>
.simple-mode-generator {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.generating-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.generating-text {
  margin: 20px 0;
  font-size: 16px;
  color: #409eff;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 13px;
}

.log-time {
  color: #909399;
  flex-shrink: 0;
}

.log-message {
  color: #333;
}

.result-panel {
  padding: 20px;
}
</style>
