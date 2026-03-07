<template>
  <div class="evaluation-detail">
    <!-- 基本信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="画像ID">
        {{ evaluation.persona_id }}
      </el-descriptions-item>
      <el-descriptions-item label="评估时间">
        {{ formatDate(evaluation.evaluated_at) }}
      </el-descriptions-item>
      <el-descriptions-item label="综合评分">
        <el-tag :type="getScoreTagType(evaluation.overall_score)" size="large">
          {{ evaluation.overall_score }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="等级">
        <el-tag :type="getLevelTagType(evaluation.overall_level)" size="large">
          {{ getLevelText(evaluation.overall_level) }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 维度评分 -->
    <div class="dimension-section">
      <h4>维度评分</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="dimension-item">
            <div class="dimension-header">
              <span>完整性</span>
              <span class="dimension-score">{{ evaluation.completeness_score || 0 }}</span>
            </div>
            <el-progress
              :percentage="evaluation.completeness_score || 0"
              :color="getProgressColor(evaluation.completeness_score)"
              :stroke-width="10"
            />
            <div class="dimension-desc">
              评估画像信息的完整程度，包括基本属性、行为特征、心理特征等维度
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="dimension-item">
            <div class="dimension-header">
              <span>一致性</span>
              <span class="dimension-score">{{ evaluation.consistency_score || 0 }}</span>
            </div>
            <el-progress
              :percentage="evaluation.consistency_score || 0"
              :color="getProgressColor(evaluation.consistency_score)"
              :stroke-width="10"
            />
            <div class="dimension-desc">
              评估画像数据的一致性和逻辑性，确保信息无矛盾
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="dimension-item">
            <div class="dimension-header">
              <span>真实性</span>
              <span class="dimension-score">{{ evaluation.authenticity_score || 0 }}</span>
            </div>
            <el-progress
              :percentage="evaluation.authenticity_score || 0"
              :color="getProgressColor(evaluation.authenticity_score)"
              :stroke-width="10"
            />
            <div class="dimension-desc">
              评估画像信息的真实性和可信度
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="dimension-item">
            <div class="dimension-header">
              <span>可操作性</span>
              <span class="dimension-score">{{ evaluation.actionability_score || 0 }}</span>
            </div>
            <el-progress
              :percentage="evaluation.actionability_score || 0"
              :color="getProgressColor(evaluation.actionability_score)"
              :stroke-width="10"
            />
            <div class="dimension-desc">
              评估画像在实际应用中的可用性和指导价值
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 评估建议 -->
    <div class="suggestion-section" v-if="evaluation.suggestions && evaluation.suggestions.length">
      <h4>改进建议</h4>
      <el-alert
        v-for="(suggestion, index) in evaluation.suggestions"
        :key="index"
        :title="suggestion.dimension"
        :description="suggestion.suggestion"
        :type="getSuggestionType(suggestion.priority)"
        :closable="false"
        show-icon
        style="margin-bottom: 10px;"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  evaluation: {
    type: Object,
    required: true
  }
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 评分标签类型
const getScoreTagType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 75) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

// 等级标签类型
const getLevelTagType = (level) => {
  const map = {
    excellent: 'success',
    good: '',
    fair: 'warning',
    poor: 'danger'
  }
  return map[level] || ''
}

// 等级文本
const getLevelText = (level) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return map[level] || level
}

// 进度条颜色
const getProgressColor = (score) => {
  if (score >= 90) return '#67c23a'
  if (score >= 75) return '#409eff'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 建议类型
const getSuggestionType = (priority) => {
  const map = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return map[priority] || 'info'
}
</script>

<style scoped>
.evaluation-detail {
  padding: 10px;
}

.dimension-section {
  margin-top: 20px;
}

.dimension-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.dimension-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
}

.dimension-score {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.dimension-desc {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.suggestion-section {
  margin-top: 20px;
}

.suggestion-section h4 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
