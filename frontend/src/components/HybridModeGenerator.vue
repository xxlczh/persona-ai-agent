<template>
  <div class="hybrid-mode-generator">
    <el-alert
      title="混合迭代模式：结合自然语言描述和数据源生成精准画像，支持迭代优化"
      type="info"
      :closable="false"
      style="margin-bottom: 20px;"
    />

    <el-card v-if="!showResult">
      <template #header>
        <div class="card-header">
          <span>描述您的目标用户</span>
          <el-tag size="small" type="warning">混合迭代模式</el-tag>
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

        <el-form-item label="产品描述">
          <el-input
            v-model="formData.productDescription"
            type="textarea"
            :rows="2"
            placeholder="描述您的产品，如：一款面向20-28岁女大学生的平价口红"
          />
          <div class="form-tip">选填，有助于生成更精准的画像</div>
        </el-form-item>

        <el-form-item label="用户画像描述" required>
          <el-input
            v-model="formData.naturalLanguageInput"
            type="textarea"
            :rows="4"
            placeholder="用自然语言详细描述您想要的画像特征，如：20-30岁一二线城市女性手游玩家，喜欢竞技类和社交类游戏，愿意为皮肤付费，月均消费100-500元..."
          />
          <div class="form-tip">请详细描述目标用户的特点，系统会结合数据源进行深度分析</div>
        </el-form-item>

        <el-divider content-position="left">选择数据源（可选）</el-divider>

        <div class="data-source-section">
          <DataSelector
            v-if="projectId"
            :project-id="projectId"
            v-model:selected-sources="selectedSources"
            :multiple="true"
          />
          <div class="source-hint">
            <el-alert
              v-if="selectedSources.length === 0"
              title="暂不选择数据源，直接基于描述生成画像"
              type="info"
              :closable="false"
            />
            <el-alert
              v-else
              :title="`已选择 ${selectedSources.length} 个数据源，将结合数据源进行深度分析`"
              type="success"
              :closable="false"
            />
          </div>
        </div>

        <el-form-item>
          <div class="generate-btn-wrapper">
            <el-button
              type="primary"
              size="large"
              :loading="generating"
              @click="startGeneration"
              class="generate-btn"
            >
              <span v-if="!generating">
                <el-icon><MagicStick /></el-icon>
                开始生成用户画像
              </span>
              <span v-else>生成中...</span>
            </el-button>
          </div>
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

    <!-- 生成结果 - 支持迭代 -->
    <div v-if="showResult && generatedPersona" class="result-panel">
      <el-alert
        title="画像生成成功"
        type="success"
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <ResultDisplay
        :persona="generatedPersona"
        @export="handleExport"
        @edit="handleEdit"
        @delete="handleDelete"
        @new="resetGenerator"
      />

      <!-- 迭代优化区域 -->
      <el-card class="iteration-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>迭代优化</span>
            <el-tag size="small" type="info">基于当前画像进行优化</el-tag>
          </div>
        </template>

        <el-form :model="iterationForm" label-width="140px">
          <el-form-item label="优化描述">
            <el-input
              v-model="iterationForm.feedback"
              type="textarea"
              :rows="3"
              placeholder="描述您想要的调整，如：让用户更年轻化，增加对社交需求的描述，去掉竞技属性..."
            />
          </el-form-item>

          <el-form-item label="调整强度">
            <el-radio-group v-model="iterationForm.strength">
              <el-radio label="subtle">小幅调整</el-radio>
              <el-radio label="moderate">中等调整</el-radio>
              <el-radio label="significant">显著调整</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="iterating" @click="startIteration">
              应用调整
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
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
import { MagicStick } from '@element-plus/icons-vue'
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
  productDescription: '',
  naturalLanguageInput: ''
})

const iterationForm = reactive({
  feedback: '',
  strength: 'moderate'
})

const generating = ref(false)
const iterating = ref(false)
const progress = ref(0)
const progressStatus = ref()
const currentLog = ref('正在初始化...')
const logs = ref([])
const generatedPersona = ref(null)
const showResult = ref(false)

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

  generating.value = true
  showResult.value = false
  progress.value = 0
  logs.value = []

  try {
    addLog('正在理解用户描述...')
    await simulateProgress(10)

    if (selectedSources.value.length > 0) {
      addLog('正在加载数据源...')
      await simulateProgress(25)
      addLog('正在分析数据特征...')
      await simulateProgress(40)
    }

    addLog('正在构建 Prompt...')
    await simulateProgress(55)
    addLog('正在调用 LLM 生成画像...')
    await simulateProgress(85)

    // 根据是否有数据源选择不同的生成方式
    let res;
    if (selectedSources.value.length > 0) {
      // 有数据源，使用精准模式
      res = await personaApi.generate({
        projectId: props.projectId,
        sourceDataIds: selectedSources.value.map(s => s.id),
        config: {
          name: formData.value.naturalLanguageInput.substring(0, 20),
          type: 'typical',
          depth: 'detailed',
          dimensions: ['demographic', 'behavioral', 'psychological', 'needs', 'scenario'],
          customPrompt: formData.value.naturalLanguageInput,
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          industry: formData.value.industry
        }
      })
    } else {
      // 无数据源，使用自然语言模式
      res = await personaApi.generateFromNaturalLanguage({
        projectId: props.projectId,
        industry: formData.value.industry,
        productDescription: formData.value.productDescription,
        naturalLanguageInput: formData.value.naturalLanguageInput
      })
    }

    if (res.success) {
      addLog('画像生成成功！')
      await simulateProgress(100)
      generatedPersona.value = res.data
      showResult.value = true
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

// 迭代优化
const startIteration = async () => {
  if (!iterationForm.feedback.trim()) {
    ElMessage.warning('请输入优化描述')
    return
  }

  iterating.value = true

  try {
    addLog('正在分析反馈...')
    await simulateProgress(20)
    addLog('正在调整画像...')
    await simulateProgress(60)
    addLog('正在优化细节...')
    await simulateProgress(90)

    // 调用迭代接口（需要后端支持）
    // 目前使用自然语言+反馈的方式重新生成
    const res = await personaApi.generateFromNaturalLanguage({
      projectId: props.projectId,
      industry: formData.value.industry,
      productDescription: formData.value.productDescription,
      naturalLanguageInput: `${formData.value.naturalLanguageInput}\n\n用户反馈：${iterationForm.feedback}`
    })

    if (res.success) {
      addLog('迭代优化完成！')
      await simulateProgress(100)
      generatedPersona.value = res.data
      iterationForm.feedback = ''
      emit('generated', res.data)
    } else {
      throw new Error(res.message || '迭代失败')
    }
  } catch (error) {
    console.error('迭代失败:', error)
    ElMessage.error(error.message || '迭代失败，请稍后重试')
  } finally {
    iterating.value = false
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
  showResult.value = false
  logs.value = []
  progress.value = 0
  iterationForm.feedback = ''
}
</script>

<style scoped>
.hybrid-mode-generator {
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

.iteration-card {
  margin-top: 20px;
}

.generate-btn-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 20px 0;
}

.generate-btn {
  width: 100%;
  max-width: 400px;
  height: 50px;
  font-size: 16px;
  border-radius: 25px;
  background: linear-gradient(135deg, #909399 0%, #b1b4bb 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(144, 147, 153, 0.3);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(144, 147, 153, 0.4);
}

.generate-btn:disabled {
  transform: none;
  box-shadow: 0 4px 15px rgba(144, 147, 153, 0.3);
}
</style>