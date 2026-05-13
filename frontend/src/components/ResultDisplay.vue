<template>
  <div class="result-display">
    <!-- 画像基本信息 -->
    <div class="persona-header">
      <div class="persona-title">
        <h2>{{ persona.name }}</h2>
        <el-tag type="success" size="large">生成成功</el-tag>
        <el-tag v-if="persona.quality_score" :type="getQualityTagType((persona.quality_score.overall_score || persona.quality_score.overall || 0) * 100)" size="large">
          质量评分: {{ ((persona.quality_score.overall_score || persona.quality_score.overall) * 100 || 0).toFixed(0) }}
        </el-tag>
      </div>
      <div class="persona-meta">
        <span>创建时间：{{ formatDate(persona.created_at) }}</span>
        <span v-if="persona.project">所属项目：{{ persona.project.name }}</span>
        <span v-if="persona.quality_score && persona.quality_score.last_evaluated_at">
          评估时间：{{ formatDate(persona.quality_score.last_evaluated_at) }}
        </span>
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
          <el-descriptions :column="2" border>
            <el-descriptions-item label="浏览时长" v-if="persona.behavioral.browse_time">
              {{ persona.behavioral.browse_time }}
            </el-descriptions-item>
            <el-descriptions-item label="品牌忠诚度" v-if="persona.behavioral.brand_loyalty !== undefined">
              <template v-if="typeof persona.behavioral.brand_loyalty === 'number'">
                <el-rate :model-value="persona.behavioral.brand_loyalty" disabled text-color="#ff9900" />
              </template>
              <template v-else>{{ persona.behavioral.brand_loyalty }}</template>
            </el-descriptions-item>
            <el-descriptions-item label="决策周期" v-if="persona.behavioral.decision_cycle">
              {{ persona.behavioral.decision_cycle }}
            </el-descriptions-item>
            <el-descriptions-item label="购买频率" v-if="persona.behavioral.purchase_frequency">
              {{ persona.behavioral.purchase_frequency }}
            </el-descriptions-item>
            <el-descriptions-item label="平均订单金额" v-if="persona.behavioral.average_order_value">
              {{ persona.behavioral.average_order_value }}
            </el-descriptions-item>
            <el-descriptions-item label="促销敏感度" v-if="persona.behavioral.promotion_sensitivity !== undefined">
              <template v-if="typeof persona.behavioral.promotion_sensitivity === 'number'">
                <el-rate :model-value="persona.behavioral.promotion_sensitivity" disabled text-color="#ff9900" />
              </template>
              <template v-else>{{ persona.behavioral.promotion_sensitivity }}</template>
            </el-descriptions-item>
            <el-descriptions-item label="搜索关键词" v-if="persona.behavioral.search_keywords && persona.behavioral.search_keywords.length" :span="2">
              <el-tag v-for="(kw, i) in persona.behavioral.search_keywords" :key="i" class="mr-2">{{ kw }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="渠道偏好" v-if="persona.behavioral.channel_preference && persona.behavioral.channel_preference.length" :span="2">
              <el-tag v-for="(cp, i) in persona.behavioral.channel_preference" :key="i" type="success" class="mr-2">{{ cp }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="品类偏好" v-if="persona.behavioral.category_preference && persona.behavioral.category_preference.length" :span="2">
              <el-tag v-for="(cp, i) in persona.behavioral.category_preference" :key="i" type="warning" class="mr-2">{{ cp }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="persona.behavioral.engagement_behavior" label="互动行为" :span="2">
              <div class="engagement-grid">
                <span>点赞: {{ persona.behavioral.engagement_behavior.likes || '无数据' }}</span>
                <span>分享: {{ persona.behavioral.engagement_behavior.shares || '无数据' }}</span>
                <span>评论: {{ persona.behavioral.engagement_behavior.comments || '无数据' }}</span>
                <span>收藏: {{ persona.behavioral.engagement_behavior.favorites || '无数据' }}</span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 心理特征 -->
      <el-tab-pane label="心理特征" name="psychological" v-if="persona.psychological">
        <div class="dimension-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="价值观" v-if="persona.psychological.values">
              <template v-if="typeof persona.psychological.values === 'object'">
                <div class="values-grid">
                  <div v-for="(value, key) in persona.psychological.values" :key="key" class="value-item">
                    <span class="value-label">{{ getValueLabel(key) }}</span>
                    <el-rate :model-value="value" disabled text-color="#ff9900" />
                  </div>
                </div>
              </template>
              <template v-else>{{ persona.psychological.values }}</template>
            </el-descriptions-item>
            <el-descriptions-item label="动机" v-if="persona.psychological.motivation">
              <template v-if="Array.isArray(persona.psychological.motivation)">
                <el-tag v-for="(m, i) in persona.psychological.motivation" :key="i" class="mr-2">{{ m }}</el-tag>
              </template>
              <template v-else>{{ persona.psychological.motivation }}</template>
            </el-descriptions-item>
            <el-descriptions-item label="痛点" v-if="persona.psychological.pain_points">
              <template v-if="Array.isArray(persona.psychological.pain_points)">
                <el-tag v-for="(p, i) in persona.psychological.pain_points" :key="i" type="danger" class="mr-2">{{ p }}</el-tag>
              </template>
              <template v-else>{{ persona.psychological.pain_points }}</template>
            </el-descriptions-item>
            <el-descriptions-item label="追求/愿望" v-if="persona.psychological.aspirations">
              <template v-if="Array.isArray(persona.psychological.aspirations)">
                <el-tag v-for="(a, i) in persona.psychological.aspirations" :key="i" type="warning" class="mr-2">{{ a }}</el-tag>
              </template>
              <template v-else>{{ persona.psychological.aspirations }}</template>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 需求分析 -->
      <el-tab-pane label="需求分析" name="needs" v-if="persona.needs">
        <div class="dimension-content">
          <el-card v-if="persona.needs.pain_points && persona.needs.pain_points.length" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>痛点</span>
              </div>
            </template>
            <div class="needs-list">
              <el-tag v-for="(p, i) in persona.needs.pain_points" :key="i" type="danger" class="mr-2">{{ p }}</el-tag>
            </div>
          </el-card>
          <el-card v-if="persona.needs.expectations && persona.needs.expectations.length" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>期望</span>
              </div>
            </template>
            <div class="needs-list">
              <el-tag v-for="(e, i) in persona.needs.expectations" :key="i" type="success" class="mr-2">{{ e }}</el-tag>
            </div>
          </el-card>
          <el-card v-if="persona.needs.emotional_needs && persona.needs.emotional_needs.length" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>情感需求</span>
              </div>
            </template>
            <div class="needs-list">
              <el-tag v-for="(n, i) in persona.needs.emotional_needs" :key="i" type="warning" class="mr-2">{{ n }}</el-tag>
            </div>
          </el-card>
          <el-card v-if="persona.needs.functional_needs && persona.needs.functional_needs.length" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>功能需求</span>
              </div>
            </template>
            <div class="needs-list">
              <el-tag v-for="(n, i) in persona.needs.functional_needs" :key="i" type="info" class="mr-2">{{ n }}</el-tag>
            </div>
          </el-card>
          <el-card v-if="persona.needs.price_sensitivity !== undefined" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>价格敏感度</span>
              </div>
            </template>
            <el-rate :model-value="persona.needs.price_sensitivity" disabled text-color="#ff9900" />
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 场景特征 -->
      <el-tab-pane label="使用场景" name="scenario" v-if="persona.scenario">
        <div class="dimension-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="使用场景" v-if="persona.scenario.usage_scene">
              {{ persona.scenario.usage_scene }}
            </el-descriptions-item>
            <el-descriptions-item label="交互渠道" v-if="persona.scenario.interaction_channel">
              {{ persona.scenario.interaction_channel }}
            </el-descriptions-item>
            <el-descriptions-item label="内容偏好" v-if="persona.scenario.content_preference">
              {{ persona.scenario.content_preference }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 质量评估 -->
      <el-tab-pane label="质量评估" name="quality" v-if="persona.quality_score">
        <div class="dimension-content">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>质量评分详情</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="综合评分">
                <el-tag :type="getQualityTagType((persona.quality_score.overall_score || persona.quality_score.overall || 0) * 100)">
                  {{ ((persona.quality_score.overall_score || persona.quality_score.overall) * 100 || 0).toFixed(0) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="质量等级">
                <el-tag :type="getLevelTagType(persona.quality_score.overall_level)">
                  {{ getLevelText(persona.quality_score.overall_level) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="完整性">
                {{ formatScore(persona.quality_score?.completeness) }}
              </el-descriptions-item>
              <el-descriptions-item label="一致性">
                {{ formatScore(persona.quality_score?.consistency) }}
              </el-descriptions-item>
              <el-descriptions-item label="真实性">
                {{ formatScore(persona.quality_score?.authenticity) }}
              </el-descriptions-item>
              <el-descriptions-item label="可操作性">
                {{ formatScore(persona.quality_score?.actionability) }}
              </el-descriptions-item>
              <el-descriptions-item label="评估时间" :span="2">
                {{ persona.quality_score?.last_evaluated_at ? formatDate(persona.quality_score.last_evaluated_at) : 'N/A' }}
              </el-descriptions-item>
            </el-descriptions>
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
              <p v-if="typeof persona.communication_style === 'string'">
                {{ persona.communication_style }}
              </p>
              <template v-else>
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
              </template>
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
              <template v-if="Array.isArray(persona.marketing_suggestions)">
                <div
                  v-for="(suggestion, index) in persona.marketing_suggestions"
                  :key="index"
                  class="marketing-item"
                >
                  <span class="marketing-index">{{ index + 1 }}</span>
                  <span class="marketing-text">{{ suggestion }}</span>
                </div>
              </template>
              <template v-else>
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
              </template>
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

// 分数格式化（处理0-1范围转0-100，以及undefined/0显示N/A）
const formatScore = (score) => {
  if (score === undefined || score === null || score === 0) return 'N/A'
  if (score < 1) score = score * 100  // 0-1范围转0-100
  return Math.round(score)
}

// 获取标签类型
const getTagType = (index) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

const getQualityTagType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 75) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

const getValueLabel = (key) => {
  const labels = {
    trend_pursuit: '追求潮流',
    value_pursuit: '追求性价比',
    quality_pursuit: '追求品质',
    practical_pursuit: '追求实用'
  }
  return labels[key] || key
}

const getLevelTagType = (level) => {
  const map = { excellent: 'success', good: '', fair: 'warning', poor: 'danger' }
  return map[level] || ''
}

const getLevelText = (level) => {
  const map = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
  return map[level] || '未知'
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

.needs-text {
  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}

.marketing-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.marketing-item:last-child {
  border-bottom: none;
}

.marketing-index {
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

.marketing-text {
  flex: 1;
  color: #606266;
  line-height: 1.6;
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

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-label {
  width: 100px;
  font-size: 13px;
}

.mr-2 {
  margin-right: 8px;
}

.engagement-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
</style>
