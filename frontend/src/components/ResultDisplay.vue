<template>
  <div class="result-display">
    <!-- 画像基本信息 -->
    <div class="persona-header">
      <div class="persona-title">
        <h2>{{ persona.name }}</h2>
        <el-tag type="success" size="large">生成成功</el-tag>
      </div>
      <div class="persona-meta">
        <span>创建时间：{{ formatDate(persona.created_at) }}</span>
        <span v-if="persona.project">所属项目：{{ persona.project.name }}</span>
      </div>
    </div>

    <!-- 画像内容 -->
    <el-tabs v-model="activeTab" class="result-tabs">
      <!-- 摘要 -->
      <el-tab-pane label="摘要" name="summary">
        <div class="summary-content">
          <el-card shadow="hover">
            <div class="summary-text">{{ persona.summary || '暂无摘要' }}</div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 人口统计特征 -->
      <el-tab-pane label="人口统计" name="demographic" v-if="persona.demographic">
        <div class="dimension-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="年龄" v-if="persona.demographic.age">
              {{ persona.demographic.age }}
            </el-descriptions-item>
            <el-descriptions-item label="性别" v-if="persona.demographic.gender">
              {{ persona.demographic.gender }}
            </el-descriptions-item>
            <el-descriptions-item label="职业" v-if="persona.demographic.occupation">
              {{ persona.demographic.occupation }}
            </el-descriptions-item>
            <el-descriptions-item label="收入" v-if="persona.demographic.income">
              {{ persona.demographic.income }}
            </el-descriptions-item>
            <el-descriptions-item label="学历" v-if="persona.demographic.education">
              {{ persona.demographic.education }}
            </el-descriptions-item>
            <el-descriptions-item label="地区" v-if="persona.demographic.location">
              {{ persona.demographic.location }}
            </el-descriptions-item>
            <el-descriptions-item label="婚姻状况" v-if="persona.demographic.marital_status">
              {{ persona.demographic.marital_status }}
            </el-descriptions-item>
            <el-descriptions-item label="家庭结构" v-if="persona.demographic.family_structure">
              {{ persona.demographic.family_structure }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="persona.demographic.description" class="dimension-desc">
            <h4>详细描述</h4>
            <p>{{ persona.demographic.description }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 行为特征 -->
      <el-tab-pane label="行为特征" name="behavioral" v-if="persona.behavioral">
        <div class="dimension-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="使用频率" v-if="persona.behavioral.usage_frequency">
              {{ persona.behavioral.usage_frequency }}
            </el-descriptions-item>
            <el-descriptions-item label="使用时段" v-if="persona.behavioral.usage_time">
              {{ persona.behavioral.usage_time }}
            </el-descriptions-item>
            <el-descriptions-item label="使用场景" v-if="persona.behavioral.usage_scenario">
              {{ persona.behavioral.usage_scenario }}
            </el-descriptions-item>
            <el-descriptions-item label="核心行为" v-if="persona.behavioral.core_behavior">
              {{ persona.behavioral.core_behavior }}
            </el-descriptions-item>
            <el-descriptions-item label="消费习惯" v-if="persona.behavioral.consumption_habit">
              {{ persona.behavioral.consumption_habit }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="persona.behavioral.description" class="dimension-desc">
            <h4>详细描述</h4>
            <p>{{ persona.behavioral.description }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 心理特征 -->
      <el-tab-pane label="心理特征" name="psychological" v-if="persona.psychological">
        <div class="dimension-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="价值观" v-if="persona.psychological.values">
              {{ persona.psychological.values }}
            </el-descriptions-item>
            <el-descriptions-item label="态度" v-if="persona.psychological.attitude">
              {{ persona.psychological.attitude }}
            </el-descriptions-item>
            <el-descriptions-item label="动机" v-if="persona.psychological.motivation">
              {{ persona.psychological.motivation }}
            </el-descriptions-item>
            <el-descriptions-item label="痛点" v-if="persona.psychological.pain_points">
              {{ persona.psychological.pain_points }}
            </el-descriptions-item>
            <el-descriptions-item label="兴趣" v-if="persona.psychological.interests">
              {{ persona.psychological.interests }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="persona.psychological.description" class="dimension-desc">
            <h4>详细描述</h4>
            <p>{{ persona.psychological.description }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 需求分析 -->
      <el-tab-pane label="需求分析" name="needs" v-if="persona.needs && persona.needs.length">
        <div class="dimension-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>用户需求</span>
              </div>
            </template>
            <div class="needs-list">
              <el-tag
                v-for="(need, index) in persona.needs"
                :key="index"
                type="primary"
                effect="plain"
                class="need-item"
              >
                {{ need }}
              </el-tag>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 使用场景 -->
      <el-tab-pane label="使用场景" name="scenario" v-if="persona.scenario && persona.scenario.length">
        <div class="dimension-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>典型场景</span>
              </div>
            </template>
            <div class="scenario-list">
              <div
                v-for="(scene, index) in persona.scenario"
                :key="index"
                class="scenario-item"
              >
                <div class="scenario-index">{{ index + 1 }}</div>
                <div class="scenario-content">{{ scene }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 人格标签 -->
      <el-tab-pane label="人格标签" name="personality" v-if="persona.personality_tags && persona.personality_tags.length">
        <div class="dimension-content">
          <div class="tags-container">
            <el-tag
              v-for="(tag, index) in persona.personality_tags"
              :key="index"
              :type="getTagType(index)"
              effect="dark"
              size="large"
              class="personality-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </el-tab-pane>

      <!-- 沟通风格 -->
      <el-tab-pane label="沟通风格" name="communication" v-if="persona.communication_style">
        <div class="dimension-content">
          <el-card shadow="hover">
            <div class="communication-content">
              <div v-if="persona.communication_style.tone">
                <h4>语气</h4>
                <p>{{ persona.communication_style.tone }}</p>
              </div>
              <div v-if="persona.communication_style.preferred_words">
                <h4>常用词汇</h4>
                <p>{{ persona.communication_style.preferred_words }}</p>
              </div>
              <div v-if="persona.communication_style.communication_habit">
                <h4>沟通习惯</h4>
                <p>{{ persona.communication_style.communication_habit }}</p>
              </div>
              <div v-if="persona.communication_style.description">
                <h4>详细描述</h4>
                <p>{{ persona.communication_style.description }}</p>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 营销建议 -->
      <el-tab-pane label="营销建议" name="marketing" v-if="persona.marketing_suggestions">
        <div class="dimension-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>营销策略建议</span>
              </div>
            </template>
            <div class="marketing-content">
              <div v-if="persona.marketing_suggestions.channel">
                <h4>推荐渠道</h4>
                <p>{{ persona.marketing_suggestions.channel }}</p>
              </div>
              <div v-if="persona.marketing_suggestions.content_type">
                <h4>内容形式</h4>
                <p>{{ persona.marketing_suggestions.content_type }}</p>
              </div>
              <div v-if="persona.marketing_suggestions.key_message">
                <h4>核心信息</h4>
                <p>{{ persona.marketing_suggestions.key_message }}</p>
              </div>
              <div v-if="persona.marketing_suggestions.promotion_strategy">
                <h4>推广策略</h4>
                <p>{{ persona.marketing_suggestions.promotion_strategy }}</p>
              </div>
              <div v-if="persona.marketing_suggestions.description">
                <h4>详细建议</h4>
                <p>{{ persona.marketing_suggestions.description }}</p>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 原始 JSON -->
      <el-tab-pane label="原始数据" name="raw">
        <div class="dimension-content">
          <el-button @click="toggleRawView" size="small">
            {{ showRaw ? '收起' : '查看' }} 原始 JSON
          </el-button>
          <div v-if="showRaw" class="raw-content">
            <pre>{{ rawJson }}</pre>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="handleExport" type="primary">
        <el-icon><Download /></el-icon>
        导出画像
      </el-button>
      <el-button @click="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button @click="handleDelete" type="danger">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
      <el-button @click="handleNew">
        <el-icon><Plus /></el-icon>
        新建画像
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Edit, Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  persona: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['export', 'edit', 'delete', 'new'])

const activeTab = ref('summary')
const showRaw = ref(false)

// 原始 JSON
const rawJson = computed(() => {
  return JSON.stringify(props.persona, null, 2)
})

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 获取标签类型
const getTagType = (index) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

// 切换原始数据视图
const toggleRawView = () => {
  showRaw.value = !showRaw.value
}

// 导出
const handleExport = () => {
  const blob = new Blob([rawJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.persona.name || 'persona'}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
  emit('export')
}

// 编辑
const handleEdit = () => {
  emit('edit', props.persona)
}

// 删除
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此用户画像吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete', props.persona.id)
  } catch (error) {
    // 用户取消
  }
}

// 新建
const handleNew = () => {
  emit('new')
}
</script>

<style scoped>
.result-display {
  padding: 10px 0;
}

.persona-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.persona-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.persona-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.persona-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 14px;
}

.result-tabs {
  margin-bottom: 24px;
}

.summary-content {
  padding: 10px;
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
}

.dimension-content {
  padding: 10px;
}

.dimension-desc {
  margin-top: 20px;
}

.dimension-desc h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
}

.dimension-desc p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.card-header {
  font-weight: 600;
}

.needs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.need-item {
  font-size: 14px;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scenario-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.scenario-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.scenario-content {
  flex: 1;
  line-height: 1.6;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.personality-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.communication-content,
.marketing-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.communication-content h4,
.marketing-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.communication-content p,
.marketing-content p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.raw-content {
  margin-top: 16px;
}

.raw-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
