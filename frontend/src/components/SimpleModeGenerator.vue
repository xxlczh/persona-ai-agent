<template>
  <div class="simple-mode-generator">
    <el-alert
      title="极简模式：通过行业选择和产品描述生成精准用户画像"
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

      <el-form :model="formData" label-width="140px">
        <el-form-item label="行业/产品类型" required>
          <el-select
            v-model="formData.industry"
            placeholder="请选择行业"
            style="width: 100%;"
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
        </el-form-item>

        <el-form-item label="产品/目标描述">
          <el-input
            v-model="formData.productDescription"
            type="textarea"
            :rows="2"
            placeholder="简单描述您的产品，如：一款面向20-28岁女大学生的平价口红 / 硬核科幻类手游，主打组队打怪"
          />
          <div class="form-tip">选填，但有助于生成更精准的画像</div>
        </el-form-item>

        <el-form-item label="用户需求描述">
          <el-input
            v-model="formData.naturalLanguageInput"
            type="textarea"
            :rows="3"
            placeholder="用自然语言描述您想要的画像，如：20-30岁手游玩家画像，热爱竞技，热衷社交"
          />
        </el-form-item>

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
      :persona="editingPersona"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import ResultDisplay from './ResultDisplay.vue'
import PersonaEditor from './PersonaEditor.vue'
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
  industry: '',
  productDescription: '',
  naturalLanguageInput: '',
  count: 1
})

const generating = ref(false)
const progress = ref(0)
const progressStatus = ref()
const currentLog = ref('正在初始化...')
const logs = ref([])
const generatedPersona = ref(null)

// 编辑对话框状态
const showEditDialog = ref(false)
const editingPersona = ref(null)

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
  if (!formData.value.industry) {
    ElMessage.warning('请选择行业/产品类型')
    return
  }
  if (!formData.value.naturalLanguageInput.trim()) {
    ElMessage.warning('请输入用户需求描述')
    return
  }

  generating.value = true
  progress.value = 0
  logs.value = []

  try {
    addLog('正在分析行业特征...')
    await simulateProgress(15)
    addLog('正在构建 Prompt...')
    await simulateProgress(30)
    addLog('正在调用 LLM 生成画像...')
    await simulateProgress(70)

    // 调用生成 API
    const res = await personaApi.generateFromNaturalLanguage({
      projectId: props.projectId,
      industry: formData.value.industry,
      productDescription: formData.value.productDescription,
      naturalLanguageInput: formData.value.naturalLanguageInput
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
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.generate-btn:disabled {
  transform: none;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}
</style>
