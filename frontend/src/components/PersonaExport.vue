<template>
  <div class="persona-export">
    <el-dialog
      v-model="dialogVisible"
      title="导出用户画像"
      width="500px"
      @close="handleClose"
    >
      <div class="export-options">
        <el-form label-width="100px">
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="json">JSON</el-radio>
              <el-radio label="markdown">Markdown</el-radio>
              <el-radio label="pdf">PDF</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="导出内容">
            <el-checkbox-group v-model="exportContent">
              <el-checkbox label="summary">基本摘要</el-checkbox>
              <el-checkbox label="demographic">人口统计</el-checkbox>
              <el-checkbox label="behavioral">行为特征</el-checkbox>
              <el-checkbox label="psychological">心理特征</el-checkbox>
              <el-checkbox label="needs">需求分析</el-checkbox>
              <el-checkbox label="personality">人格标签</el-checkbox>
              <el-checkbox label="marketing">营销建议</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="文件名">
            <el-input v-model="fileName" :placeholder="defaultFileName" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleExport">
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const exportFormat = ref('json')
const exportContent = ref(['summary', 'demographic', 'behavioral', 'psychological', 'needs', 'personality', 'marketing'])
const fileName = ref('')

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

// 监听对话框关闭
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 默认文件名
const defaultFileName = computed(() => {
  return props.persona?.name ? `${props.persona.name}_画像` : 'persona'
})

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 导出
const handleExport = () => {
  const persona = props.persona

  if (exportFormat.value === 'json') {
    exportJson(persona)
  } else if (exportFormat.value === 'markdown') {
    exportMarkdown(persona)
  } else if (exportFormat.value === 'pdf') {
    ElMessage.info('PDF 导出功能开发中')
  }

  ElMessage.success('导出成功')
  handleClose()
}

// 导出 JSON
const exportJson = (persona) => {
  const data = filterPersonaData(persona)
  const jsonStr = JSON.stringify(data, null, 2)
  downloadFile(jsonStr, `${fileName.value || defaultFileName.value}.json`, 'application/json')
}

// 导出 Markdown
const exportMarkdown = (persona) => {
  const md = generateMarkdown(persona)
  downloadFile(md, `${fileName.value || defaultFileName.value}.md`, 'text/markdown')
}

// 过滤数据
const filterPersonaData = (persona) => {
  const result = {}
  const content = exportContent.value

  if (content.includes('summary')) {
    result.name = persona.name
    result.summary = persona.summary
  }
  if (content.includes('demographic')) {
    result.demographic = persona.demographic
  }
  if (content.includes('behavioral')) {
    result.behavioral = persona.behavioral
  }
  if (content.includes('psychological')) {
    result.psychological = persona.psychological
  }
  if (content.includes('needs')) {
    result.needs = persona.needs
  }
  if (content.includes('personality')) {
    result.personality_tags = persona.personality_tags
  }
  if (content.includes('marketing')) {
    result.marketing_suggestions = persona.marketing_suggestions
  }

  return result
}

// 生成 Markdown
const generateMarkdown = (persona) => {
  let md = `# ${persona.name || '用户画像'}\n\n`

  if (exportContent.value.includes('summary') && persona.summary) {
    md += `## 摘要\n\n${persona.summary}\n\n`
  }

  if (exportContent.value.includes('demographic') && persona.demographic) {
    md += `## 人口统计特征\n\n`
    const d = persona.demographic
    if (d.age) md += `- **年龄**: ${d.age}\n`
    if (d.gender) md += `- **性别**: ${d.gender}\n`
    if (d.occupation) md += `- **职业**: ${d.occupation}\n`
    if (d.income) md += `- **收入**: ${d.income}\n`
    if (d.education) md += `- **学历**: ${d.education}\n`
    if (d.location) md += `- **地区**: ${d.location}\n`
    if (d.description) md += `\n${d.description}\n`
    md += '\n'
  }

  if (exportContent.value.includes('behavioral') && persona.behavioral) {
    md += `## 行为特征\n\n`
    const b = persona.behavioral
    if (b.usage_frequency) md += `- **使用频率**: ${b.usage_frequency}\n`
    if (b.usage_time) md += `- **使用时段**: ${b.usage_time}\n`
    if (b.usage_scenario) md += `- **使用场景**: ${b.usage_scenario}\n`
    if (b.core_behavior) md += `- **核心行为**: ${b.core_behavior}\n`
    if (b.consumption_habit) md += `- **消费习惯**: ${b.consumption_habit}\n`
    if (b.description) md += `\n${b.description}\n`
    md += '\n'
  }

  if (exportContent.value.includes('psychological') && persona.psychological) {
    md += `## 心理特征\n\n`
    const p = persona.psychological
    if (p.values) md += `- **价值观**: ${p.values}\n`
    if (p.attitude) md += `- **态度**: ${p.attitude}\n`
    if (p.motivation) md += `- **动机**: ${p.motivation}\n`
    if (p.pain_points) md += `- **痛点**: ${p.pain_points}\n`
    if (p.interests) md += `- **兴趣**: ${p.interests}\n`
    if (p.description) md += `\n${p.description}\n`
    md += '\n'
  }

  if (exportContent.value.includes('needs') && persona.needs?.length) {
    md += `## 用户需求\n\n`
    persona.needs.forEach(need => {
      md += `- ${need}\n`
    })
    md += '\n'
  }

  if (exportContent.value.includes('personality') && persona.personality_tags?.length) {
    md += `## 人格标签\n\n`
    persona.personality_tags.forEach(tag => {
      md += `- ${tag}\n`
    })
    md += '\n'
  }

  if (exportContent.value.includes('marketing') && persona.marketing_suggestions) {
    md += `## 营销建议\n\n`
    const m = persona.marketing_suggestions
    if (m.channel) md += `- **推荐渠道**: ${m.channel}\n`
    if (m.content_type) md += `- **内容形式**: ${m.content_type}\n`
    if (m.key_message) md += `- **核心信息**: ${m.key_message}\n`
    if (m.promotion_strategy) md += `- **推广策略**: ${m.promotion_strategy}\n`
    if (m.description) md += `\n${m.description}\n`
  }

  return md
}

// 下载文件
const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.export-options {
  padding: 10px 0;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
