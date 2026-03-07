<template>
  <div class="persona-editor">
    <el-dialog
      v-model="dialogVisible"
      title="编辑用户画像"
      width="800px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="画像名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入画像名称" />
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="formData.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入画像摘要"
          />
        </el-form-item>

        <!-- 人口统计特征 -->
        <el-divider content-position="left">人口统计特征</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input v-model="formData.demographic.age" placeholder="如：25-35岁" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-input v-model="formData.demographic.gender" placeholder="如：男/女" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="职业">
              <el-input v-model="formData.demographic.occupation" placeholder="如：产品经理" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="收入">
              <el-input v-model="formData.demographic.income" placeholder="如：10-20万" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学历">
              <el-input v-model="formData.demographic.education" placeholder="如：本科" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地区">
              <el-input v-model="formData.demographic.location" placeholder="如：北京" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细描述">
          <el-input
            v-model="formData.demographic.description"
            type="textarea"
            :rows="2"
            placeholder="请输入人口统计特征的详细描述"
          />
        </el-form-item>

        <!-- 心理特征 -->
        <el-divider content-position="left">心理特征</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价值观">
              <el-input v-model="formData.psychological.values" placeholder="请描述核心价值观" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="态度">
              <el-input v-model="formData.psychological.attitude" placeholder="请描述对产品的态度" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="动机">
              <el-input v-model="formData.psychological.motivation" placeholder="请描述购买动机" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="痛点">
              <el-input v-model="formData.psychological.pain_points" placeholder="请描述用户痛点" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="兴趣">
          <el-input v-model="formData.psychological.interests" placeholder="请描述兴趣爱好" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input
            v-model="formData.psychological.description"
            type="textarea"
            :rows="2"
            placeholder="请输入心理特征的详细描述"
          />
        </el-form-item>

        <!-- 需求分析 -->
        <el-divider content-position="left">需求分析</el-divider>
        <el-form-item label="用户需求">
          <div class="tags-input">
            <el-tag
              v-for="(need, index) in formData.needs"
              :key="index"
              closable
              @close="removeNeed(index)"
              class="need-tag"
            >
              {{ need }}
            </el-tag>
            <el-input
              v-if="needInputVisible"
              ref="needInputRef"
              v-model="needInputValue"
              size="small"
              class="need-input"
              @keyup.enter="addNeed"
              @blur="addNeed"
            />
            <el-button v-else size="small" @click="showNeedInput">+ 添加</el-button>
          </div>
        </el-form-item>

        <!-- 人格标签 -->
        <el-divider content-position="left">人格标签</el-divider>
        <el-form-item label="人格标签">
          <div class="tags-input">
            <el-tag
              v-for="(tag, index) in formData.personality_tags"
              :key="index"
              closable
              @close="removeTag(index)"
              type="success"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              class="need-input"
              @keyup.enter="addTag"
              @blur="addTag"
            />
            <el-button v-else size="small" @click="showTagInput">+ 添加</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  persona: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(false)
const formRef = ref(null)
const saving = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  summary: '',
  demographic: {
    age: '',
    gender: '',
    occupation: '',
    income: '',
    education: '',
    location: '',
    description: ''
  },
  behavioral: {
    usage_frequency: '',
    usage_time: '',
    usage_scenario: '',
    core_behavior: '',
    consumption_habit: '',
    description: ''
  },
  psychological: {
    values: '',
    attitude: '',
    motivation: '',
    pain_points: '',
    interests: '',
    description: ''
  },
  needs: [],
  scenario: [],
  personality_tags: [],
  communication_style: {},
  marketing_suggestions: {}
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入画像名称', trigger: 'blur' }
  ]
}

// 需求标签输入
const needInputVisible = ref(false)
const needInputValue = ref('')
const needInputRef = ref(null)

// 人格标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref(null)

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    initFormData()
  }
})

// 监听对话框关闭
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 初始化表单数据
const initFormData = () => {
  const p = props.persona
  formData.name = p.name || ''
  formData.summary = p.summary || ''
  formData.demographic = {
    age: p.demographic?.age || '',
    gender: p.demographic?.gender || '',
    occupation: p.demographic?.occupation || '',
    income: p.demographic?.income || '',
    education: p.demographic?.education || '',
    location: p.demographic?.location || '',
    description: p.demographic?.description || ''
  }
  formData.behavioral = {
    usage_frequency: p.behavioral?.usage_frequency || '',
    usage_time: p.behavioral?.usage_time || '',
    usage_scenario: p.behavioral?.usage_scenario || '',
    core_behavior: p.behavioral?.core_behavior || '',
    consumption_habit: p.behavioral?.consumption_habit || '',
    description: p.behavioral?.description || ''
  }
  formData.psychological = {
    values: p.psychological?.values || '',
    attitude: p.psychological?.attitude || '',
    motivation: p.psychological?.motivation || '',
    pain_points: p.psychological?.pain_points || '',
    interests: p.psychological?.interests || '',
    description: p.psychological?.description || ''
  }
  formData.needs = p.needs ? [...p.needs] : []
  formData.scenario = p.scenario ? [...p.scenario] : []
  formData.personality_tags = p.personality_tags ? [...p.personality_tags] : []
  formData.communication_style = p.communication_style || {}
  formData.marketing_suggestions = p.marketing_suggestions || {}
}

// 需求标签操作
const showNeedInput = () => {
  needInputVisible.value = true
  nextTick(() => {
    needInputRef.value?.focus()
  })
}

const addNeed = () => {
  if (needInputValue.value) {
    formData.needs.push(needInputValue.value)
  }
  needInputVisible.value = false
  needInputValue.value = ''
}

const removeNeed = (index) => {
  formData.needs.splice(index, 1)
}

// 人格标签操作
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  if (tagInputValue.value) {
    formData.personality_tags.push(tagInputValue.value)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (index) => {
  formData.personality_tags.splice(index, 1)
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    // 清理空值
    const data = {
      name: formData.name,
      summary: formData.summary,
      demographic: cleanObject(formData.demographic),
      behavioral: cleanObject(formData.behavioral),
      psychological: cleanObject(formData.psychological),
      needs: formData.needs,
      scenario: formData.scenario,
      personality_tags: formData.personality_tags,
      communication_style: formData.communication_style,
      marketing_suggestions: formData.marketing_suggestions
    }

    emit('save', data)
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    saving.value = false
  }
}

// 清理空值对象
const cleanObject = (obj) => {
  const result = {}
  for (const key in obj) {
    if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

// 暴露方法供父组件调用
defineExpose({
  setSaving: (val) => { saving.value = val },
  close: () => { dialogVisible.value = false }
})
</script>

<style scoped>
.persona-editor {
  /* 组件样式 */
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.need-tag {
  margin: 0;
}

.need-input {
  width: 100px;
}
</style>
