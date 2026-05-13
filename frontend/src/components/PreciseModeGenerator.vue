<template>
  <div class="precise-mode-generator">
    <el-alert
      title="精准定制模式：基于数据源生成精准用户画像"
      type="info"
      :closable="false"
      style="margin-bottom: 20px;"
    />

    <el-card v-if="!generatedPersona">
      <template #header>
        <div class="card-header">
          <span>描述您的目标用户</span>
          <el-tag size="small" type="warning">精准定制模式</el-tag>
        </div>
      </template>

      <el-form :model="formData" label-width="140px">
        <el-form-item label="行业/产品类型" required>
          <el-select
            v-model="formData.industry"
            placeholder="请选择行业"
            style="width: 100%;"
            clearable
          >
            <el-option label="游戏（手游/端游）" value="游戏" />
            <el-option label="美妆护肤" value="美妆护肤" />
            <el-option label="3C数码" value="3C数码" />
            <el-option label="电商零售" value="电商零售" />
            <el-option label="教育学习" value="教育学习" />
            <el-option label="职场效率工具" value="职场效率工具" />
            <el-option label="健康健身" value="健康健身" />
            <el-option label="母婴亲子" value="母婴亲子" />
            <el-option label="内容社区（短视频/图文）" value="内容社区" />
            <el-option label="金融理财" value="金融理财" />
            <el-option label="旅游出行" value="旅游出行" />
            <el-option label="其他" value="其他" />
          </el-select>
          <div class="form-tip">选填，帮助 AI 更准确理解目标用户</div>
        </el-form-item>

        <el-form-item label="用户画像描述">
          <el-input
            v-model="formData.naturalLanguageInput"
            type="textarea"
            :rows="3"
            placeholder="用自然语言描述您想要的画像，如：20-30岁手游玩家画像，热爱竞技，热衷社交"
          />
        </el-form-item>

        <el-divider content-position="left">选择数据源</el-divider>

        <div class="data-source-section">
          <DataSelector
            v-if="projectId"
            :project-id="projectId"
            v-model:selected-sources="selectedSources"
            :multiple="true"
          />
          <div v-if="selectedSources.length === 0" class="source-hint">
            <el-alert title="请选择至少一个数据源" type="warning" :closable="false" />
          </div>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            :loading="generating"
            :disabled="selectedSources.length === 0"
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

    <!-- 编辑对话框 -->
    <PersonaEditor
      v-model="showEditDialog"
      :persona="editingPersona || {}"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import DataSelector from './DataSelector.vue'
import ResultDisplay from './ResultDisplay.vue'
import PersonaEditor from './PersonaEditor.vue'
import { personaApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['generated'])

const formData = ref({
  industry: '',
  naturalLanguageInput: ''
})

const generating = ref(false)
const progress = ref(0)
const progressStatus = ref()
const currentLog = ref('正在初始化...')
const logs = ref([])
const generatedPersona = ref(null)

// 数据源选择
const selectedSources = ref([])

// 编辑对话框状态
const showEditDialog = ref(false)
const editingPersona = ref(null)

const addLog = (message) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.push({ time, message })
  currentLog.value = message
}

const startGeneration = async () => {
  if (!formData.value.naturalLanguageInput.trim()) {
    ElMessage.warning('请输入用户画像描述')
    return
  }

  if (selectedSources.value.length === 0) {
    ElMessage.warning('请选择至少一个数据源')
    return
  }

  generating.value = true
  progress.value = 0
  logs.value = []

  try {
    addLog('正在加载数据源...')
    await simulateProgress(15)
    addLog('正在分析数据特征...')
    await simulateProgress(30)
    addLog('正在构建 Prompt...')
    await simulateProgress(50)
    addLog('正在调用 LLM 生成画像...')
    await simulateProgress(80)

    // 调用生成 API（使用精准模式）
    const res = await personaApi.generate({
      projectId: props.projectId,
      sourceDataIds: selectedSources.value.map(s => s.id),
      config: {
        name: formData.value.naturalLanguageInput.substring(0, 20),
        type: 'typical',
        depth: 'standard',
        dimensions: ['demographic', 'behavioral', 'psychological', 'needs', 'scenario'],
        customPrompt: formData.value.naturalLanguageInput,
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        industry: formData.value.industry
      }
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

const handleEdit = (persona) => {
  editingPersona.value = persona
  showEditDialog.value = true
}

// 保存编辑
const handleSave = async (data) => {
  try {
    const res = await personaApi.update(editingPersona.value.id, data)
    if (res.success) {
      ElMessage.success('保存成功')
      generatedPersona.value = res.data
      showEditDialog.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  }
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
.precise-mode-generator {
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

.data-source-section {
  margin-bottom: 20px;
}

.source-hint {
  margin-bottom: 16px;
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