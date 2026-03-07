<template>
  <div class="prompt-config">
    <div class="section-header">
      <h3>Prompt 配置</h3>
      <p class="section-desc">配置生成用户画像时的 Prompt 参数</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <!-- 画像名称 -->
      <el-form-item label="画像名称" prop="personaName">
        <el-input
          v-model="form.personaName"
          placeholder="请输入画像名称，例如：年轻白领女性"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <!-- 画像类型 -->
      <el-form-item label="画像类型" prop="personaType">
        <el-select v-model="form.personaType" placeholder="请选择画像类型" style="width: 100%">
          <el-option label="典型用户" value="typical" />
          <el-option label="极端用户" value="extreme" />
          <el-option label="负面用户" value="negative" />
          <el-option label="潜在用户" value="potential" />
        </el-select>
      </el-form-item>

      <!-- 分析深度 -->
      <el-form-item label="分析深度" prop="depth">
        <el-radio-group v-model="form.depth">
          <el-radio label="basic">基础分析</el-radio>
          <el-radio label="standard">标准分析</el-radio>
          <el-radio label="deep">深度分析</el-radio>
        </el-radio-group>
        <div class="depth-desc">
          {{ depthDescription }}
        </div>
      </el-form-item>

      <!-- 输出维度 -->
      <el-form-item label="输出维度" prop="dimensions">
        <el-checkbox-group v-model="form.dimensions">
          <el-checkbox label="demographic">人口统计特征</el-checkbox>
          <el-checkbox label="behavioral">行为特征</el-checkbox>
          <el-checkbox label="psychological">心理特征</el-checkbox>
          <el-checkbox label="needs">需求分析</el-checkbox>
          <el-checkbox label="scenario">使用场景</el-checkbox>
          <el-checkbox label="personality">人格标签</el-checkbox>
          <el-checkbox label="communication">沟通风格</el-checkbox>
          <el-checkbox label="marketing">营销建议</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 自定义 Prompt -->
      <el-form-item label="自定义说明" prop="customPrompt">
        <el-input
          v-model="form.customPrompt"
          type="textarea"
          :rows="4"
          placeholder="可选输入额外的 Prompt 说明，引导生成特定类型的用户画像"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- LLM 提供商 -->
      <el-form-item label="LLM 提供商" prop="provider">
        <el-select v-model="form.provider" placeholder="请选择 LLM" style="width: 100%">
          <el-option label="OpenAI GPT" value="openai" />
          <el-option label="百度文心一言" value="ernie" />
          <el-option label="智谱 GLM" value="zhipu" />
        </el-select>
      </el-form-item>

      <!-- 模型选择 -->
      <el-form-item label="模型" prop="model">
        <el-select v-model="form.model" placeholder="请选择模型" style="width: 100%">
          <el-option
            v-for="model in availableModels"
            :key="model.value"
            :label="model.label"
            :value="model.value"
          />
        </el-select>
      </el-form-item>

      <!-- 温度参数 -->
      <el-form-item label="创意程度" prop="temperature">
        <div class="temperature-wrapper">
          <el-slider v-model="form.temperature" :min="0" :max="1" :step="0.1" :marks="temperatureMarks" />
          <span class="temperature-value">{{ form.temperature }}</span>
        </div>
        <div class="temperature-desc">
          值越低越保守，越高越有创意
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const emit = defineEmits(['update:config'])

const formRef = ref(null)

const form = reactive({
  personaName: '',
  personaType: 'typical',
  depth: 'standard',
  dimensions: ['demographic', 'behavioral', 'psychological', 'needs', 'scenario'],
  customPrompt: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7
})

const rules = {
  personaName: [
    { required: true, message: '请输入画像名称', trigger: 'blur' },
    { max: 100, message: '画像名称不能超过100个字符', trigger: 'blur' }
  ],
  personaType: [
    { required: true, message: '请选择画像类型', trigger: 'change' }
  ],
  depth: [
    { required: true, message: '请选择分析深度', trigger: 'change' }
  ],
  dimensions: [
    { type: 'array', required: true, message: '请至少选择一个输出维度', trigger: 'change' }
  ],
  provider: [
    { required: true, message: '请选择 LLM 提供商', trigger: 'change' }
  ],
  model: [
    { required: true, message: '请选择模型', trigger: 'change' }
  ]
}

// 模型列表
const modelOptions = {
  openai: [
    { label: 'GPT-4o Mini (推荐)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
  ],
  ernie: [
    { label: 'ERNIE 4.0', value: 'ernie-4.0-8k' },
    { label: 'ERNIE 3.5', value: 'ernie-3.5-8k' },
    { label: 'ERNIE Speed', value: 'ernie-speed-8k' }
  ],
  zhipu: [
    { label: 'GLM-4', value: 'glm-4' },
    { label: 'GLM-4 Turbo', value: 'glm-4-turbo' },
    { label: 'GLM-3 Turbo', value: 'glm-3-turbo' }
  ]
}

const availableModels = computed(() => {
  return modelOptions[form.provider] || []
})

// 根据提供商变化自动切换模型
const updateModel = (provider) => {
  const models = modelOptions[provider]
  if (models && models.length > 0) {
    form.model = models[0].value
  }
}

// 监听提供商变化
const handleProviderChange = () => {
  updateModel(form.provider)
  emitConfig()
}

// 监听其他配置变化
const handleConfigChange = () => {
  emitConfig()
}

// 发出配置
const emitConfig = () => {
  emit('update:config', { ...form })
}

// 温度标记
const temperatureMarks = {
  0: '保守',
  0.5: '平衡',
  1: '创意'
}

// 深度描述
const depthDescription = computed(() => {
  const descriptions = {
    basic: '基础分析：生成简单的用户画像，包含基本的人口统计特征和行为描述',
    standard: '标准分析：生成完整的用户画像，包含多维度特征和需求分析',
    deep: '深度分析：生成详细深入的用户画像，包含心理分析、场景还原和营销建议'
  }
  return descriptions[form.depth]
})

// 验证表单
const validate = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

// 获取配置
const getConfig = () => {
  return { ...form }
}

// 暴露方法
defineExpose({
  validate,
  getConfig
})
</script>

<style scoped>
.prompt-config {
  padding: 10px 0;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.section-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.depth-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.temperature-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.temperature-wrapper .el-slider {
  flex: 1;
}

.temperature-value {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  color: #409eff;
}

.temperature-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-checkbox {
  margin-right: 0;
}
</style>
