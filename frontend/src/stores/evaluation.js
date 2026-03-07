import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import evaluationApi from '../api/evaluation'
import { ElMessage } from 'element-plus'

export const useEvaluationStore = defineStore('evaluation', () => {
  // 状态
  const currentEvaluation = ref(null)
  const evaluationHistory = ref([])
  const statistics = ref(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const hasHistory = computed(() => evaluationHistory.value.length > 0)
  const hasStatistics = computed(() => statistics.value !== null)

  // 评估画像
  async function evaluatePersona(personaId, data = {}) {
    loading.value = true
    try {
      const res = await evaluationApi.evaluatePersona(personaId, data)
      currentEvaluation.value = res.data
      ElMessage.success('评估完成')
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 获取评估历史
  async function fetchEvaluationHistory(personaId, params = {}) {
    loading.value = true
    try {
      const res = await evaluationApi.getHistory(personaId, {
        limit: pageSize.value,
        offset: (currentPage.value - 1) * pageSize.value,
        ...params
      })
      evaluationHistory.value = res.data.list
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 获取项目评估统计
  async function fetchStatistics(projectId) {
    loading.value = true
    try {
      const res = await evaluationApi.getStatistics(projectId)
      statistics.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 设置当前评估
  function setCurrentEvaluation(evaluation) {
    currentEvaluation.value = evaluation
  }

  // 清空当前评估
  function clearCurrentEvaluation() {
    currentEvaluation.value = null
  }

  // 清空评估历史
  function clearHistory() {
    evaluationHistory.value = []
    total.value = 0
    currentPage.value = 1
  }

  // 清空统计数据
  function clearStatistics() {
    statistics.value = null
  }

  // 分页设置
  function setPage(page, size) {
    currentPage.value = page
    pageSize.value = size
  }

  // 计算平均分数
  function getAverageScore() {
    if (!statistics.value || !statistics.value.avg_scores) return null
    const scores = statistics.value.avg_scores
    const totalScore = (scores.completeness || 0) +
      (scores.consistency || 0) +
      (scores.actionability || 0) +
      (scores.accuracy || 0)
    return (totalScore / 4).toFixed(2)
  }

  return {
    // 状态
    currentEvaluation,
    evaluationHistory,
    statistics,
    loading,
    total,
    currentPage,
    pageSize,
    // 计算属性
    hasHistory,
    hasStatistics,
    // 方法
    evaluatePersona,
    fetchEvaluationHistory,
    fetchStatistics,
    setCurrentEvaluation,
    clearCurrentEvaluation,
    clearHistory,
    clearStatistics,
    setPage,
    getAverageScore
  }
})
