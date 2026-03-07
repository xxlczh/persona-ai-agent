<template>
  <div class="evaluation-dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.total_personas || 0 }}</div>
            <div class="stat-label">总画像数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.total_evaluations || 0 }}</div>
            <div class="stat-label">评估次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.average_score || 0 }}</div>
            <div class="stat-label">平均分</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value" :class="scoreLevelClass">
              {{ scoreLevel }}
            </div>
            <div class="stat-label">整体等级</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>评分分布</span>
            </div>
          </template>
          <ScoreChart
            type="bar"
            :data="scoreDistribution"
            :loading="loading"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>维度评分</span>
            </div>
          </template>
          <ScoreChart
            type="radar"
            :data="dimensionAverages"
            :loading="loading"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 评估历史列表 -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>最近评估</span>
        </div>
      </template>
      <el-table :data="latestEvaluations" v-loading="loading" stripe>
        <el-table-column prop="persona_id" label="画像ID" width="100" />
        <el-table-column prop="overall_score" label="综合评分" width="120">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.overall_score)">
              {{ row.overall_score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overall_level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.overall_level)">
              {{ row.overall_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="evaluated_at" label="评估时间">
          <template #default="{ row }">
            {{ formatDate(row.evaluated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 评估详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="评估详情"
      width="700px"
    >
      <EvaluationDetail
        v-if="selectedEvaluation"
        :evaluation="selectedEvaluation"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import evaluationApi from '@/api/evaluation'
import ScoreChart from './ScoreChart.vue'
import EvaluationDetail from './EvaluationDetail.vue'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const loading = ref(false)
const statistics = ref({})
const latestEvaluations = ref([])
const detailDialogVisible = ref(false)
const selectedEvaluation = ref(null)

// 评分分布数据
const scoreDistribution = computed(() => {
  const dist = statistics.value.score_distribution || {}
  return [
    { name: '优秀', value: dist.excellent || 0 },
    { name: '良好', value: dist.good || 0 },
    { name: '一般', value: dist.fair || 0 },
    { name: '较差', value: dist.poor || 0 }
  ]
})

// 维度平均分数据
const dimensionAverages = computed(() => {
  const dims = statistics.value.dimension_averages || {}
  return [
    { name: '完整性', value: dims.completeness || 0 },
    { name: '一致性', value: dims.consistency || 0 },
    { name: '真实性', value: dims.authenticity || 0 },
    { name: '可操作性', value: dims.actionability || 0 }
  ]
})

// 整体等级
const scoreLevel = computed(() => {
  const avg = statistics.value.average_score || 0
  if (avg >= 90) return '优秀'
  if (avg >= 75) return '良好'
  if (avg >= 60) return '一般'
  if (avg > 0) return '较差'
  return '暂无'
})

// 等级样式类
const scoreLevelClass = computed(() => {
  const avg = statistics.value.average_score || 0
  if (avg >= 90) return 'level-excellent'
  if (avg >= 75) return 'level-good'
  if (avg >= 60) return 'level-fair'
  if (avg > 0) return 'level-poor'
  return ''
})

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    const res = await evaluationApi.getStatistics(props.projectId)
    if (res.data.success) {
      statistics.value = res.data.data
      latestEvaluations.value = res.data.data.latest_evaluations || []
    }
  } catch (error) {
    console.error('获取评估统计失败:', error)
    ElMessage.error('获取评估统计失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = (evaluation) => {
  selectedEvaluation.value = evaluation
  detailDialogVisible.value = true
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

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchStatistics()
})

// 暴露刷新方法
defineExpose({
  refresh: fetchStatistics
})
</script>

<style scoped>
.evaluation-dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.level-excellent {
  color: #67c23a;
}

.level-good {
  color: #409eff;
}

.level-fair {
  color: #e6a23c;
}

.level-poor {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
}

.card-header {
  font-weight: bold;
}

.history-card {
  margin-top: 20px;
}
</style>
