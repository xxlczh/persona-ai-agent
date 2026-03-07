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
              <el-radio label="image">图片</el-radio>
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

      <!-- 预览区域 -->
      <div v-if="showPreview" ref="previewRef" class="export-preview">
        <h2>{{ persona?.name || '用户画像' }}</h2>

        <div v-if="exportContent.includes('summary') && persona?.summary" class="preview-section">
          <h3>摘要</h3>
          <p>{{ persona.summary }}</p>
        </div>

        <div v-if="exportContent.includes('demographic') && persona?.demographic" class="preview-section">
          <h3>人口统计特征</h3>
          <ul>
            <li v-if="persona.demographic.age">年龄: {{ persona.demographic.age }}</li>
            <li v-if="persona.demographic.gender">性别: {{ persona.demographic.gender }}</li>
            <li v-if="persona.demographic.occupation">职业: {{ persona.demographic.occupation }}</li>
            <li v-if="persona.demographic.income">收入: {{ persona.demographic.income }}</li>
            <li v-if="persona.demographic.education">学历: {{ persona.demographic.education }}</li>
            <li v-if="persona.demographic.location">地区: {{ persona.demographic.location }}</li>
          </ul>
        </div>

        <div v-if="exportContent.includes('behavioral') && persona?.behavioral" class="preview-section">
          <h3>行为特征</h3>
          <ul>
            <li v-if="persona.behavioral.usage_frequency">使用频率: {{ persona.behavioral.usage_frequency }}</li>
            <li v-if="persona.behavioral.usage_time">使用时段: {{ persona.behavioral.usage_time }}</li>
            <li v-if="persona.behavioral.usage_scenario">使用场景: {{ persona.behavioral.usage_scenario }}</li>
            <li v-if="persona.behavioral.core_behavior">核心行为: {{ persona.behavioral.core_behavior }}</li>
            <li v-if="persona.behavioral.consumption_habit">消费习惯: {{ persona.behavioral.consumption_habit }}</li>
          </ul>
        </div>

        <div v-if="exportContent.includes('psychological') && persona?.psychological" class="preview-section">
          <h3>心理特征</h3>
          <ul>
            <li v-if="persona.psychological.values">价值观: {{ persona.psychological.values }}</li>
            <li v-if="persona.psychological.attitude">态度: {{ persona.psychological.attitude }}</li>
            <li v-if="persona.psychological.motivation">动机: {{ persona.psychological.motivation }}</li>
            <li v-if="persona.psychological.pain_points">痛点: {{ persona.psychological.pain_points }}</li>
            <li v-if="persona.psychological.interests">兴趣: {{ persona.psychological.interests }}</li>
          </ul>
        </div>

        <div v-if="exportContent.includes('needs') && persona?.needs?.length" class="preview-section">
          <h3>用户需求</h3>
          <ul>
            <li v-for="(need, index) in persona.needs" :key="index">{{ need }}</li>
          </ul>
        </div>

        <div v-if="exportContent.includes('personality') && persona?.personality_tags?.length" class="preview-section">
          <h3>人格标签</h3>
          <div class="tags">
            <el-tag v-for="(tag, index) in persona.personality_tags" :key="index" class="persona-tag">
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <div v-if="exportContent.includes('marketing') && persona?.marketing_suggestions" class="preview-section">
          <h3>营销建议</h3>
          <ul>
            <li v-if="persona.marketing_suggestions.channel">推荐渠道: {{ persona.marketing_suggestions.channel }}</li>
            <li v-if="persona.marketing_suggestions.content_type">内容形式: {{ persona.marketing_suggestions.content_type }}</li>
            <li v-if="persona.marketing_suggestions.key_message">核心信息: {{ persona.marketing_suggestions.key_message }}</li>
            <li v-if="persona.marketing_suggestions.promotion_strategy">推广策略: {{ persona.marketing_suggestions.promotion_strategy }}</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import personaApi from '../api/persona'

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
const exporting = ref(false)
const previewRef = ref(null)

// 是否显示预览（PDF 和图片导出时）
const showPreview = computed(() => {
  return ['pdf', 'image'].includes(exportFormat.value)
})

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
const handleExport = async () => {
  exporting.value = true

  try {
    const persona = props.persona

    if (exportFormat.value === 'json') {
      exportJson(persona)
    } else if (exportFormat.value === 'markdown') {
      exportMarkdown(persona)
    } else if (exportFormat.value === 'pdf') {
      await exportPdf()
    } else if (exportFormat.value === 'image') {
      await exportImage()
    }

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
    handleClose()
  }
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

// 导出 PDF
const exportPdf = async () => {
  if (!previewRef.value) {
    throw new Error('预览元素不存在')
  }

  // 使用后端 API 导出 PDF
  try {
    const response = await personaApi.export(props.persona.id, {
      format: 'pdf',
      content: exportContent.value
    })

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName.value || defaultFileName.value}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    // 如果后端失败，使用前端方案
    console.warn('后端导出失败，使用前端方案:', error)
    await exportPdfFrontend()
  }
}

// 前端 PDF 导出方案
const exportPdfFrontend = async () => {
  if (!previewRef.value) {
    throw new Error('预览元素不存在')
  }

  const canvas = await html2canvas(previewRef.value, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const imgWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${fileName.value || defaultFileName.value}.pdf`)
}

// 导出图片
const exportImage = async () => {
  if (!previewRef.value) {
    throw new Error('预览元素不存在')
  }

  const canvas = await html2canvas(previewRef.value, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  })

  const link = document.createElement('a')
  link.download = `${fileName.value || defaultFileName.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
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

.export-preview {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.export-preview h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #303133;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section h3 {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
}

.preview-section p {
  color: #606266;
  line-height: 1.6;
}

.preview-section ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.preview-section li {
  margin-bottom: 4px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.persona-tag {
  margin: 0;
}
</style>
