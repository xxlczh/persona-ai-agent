import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import personaApi from '../api/persona'
import { ElMessage } from 'element-plus'

export const usePersonaStore = defineStore('persona', () => {
  // 状态
  const personas = ref([])
  const currentPersona = ref(null)
  const loading = ref(false)
  const generating = ref(false)
  const generationProgress = ref(0)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 计算属性
  const hasPersonas = computed(() => personas.value.length > 0)
  const completedPersonas = computed(() =>
    personas.value.filter(p => p.status === 'completed')
  )
  const pendingPersonas = computed(() =>
    personas.value.filter(p => p.status === 'pending')
  )

  // 获取画像列表
  async function fetchPersonas(params = {}) {
    loading.value = true
    try {
      const res = await personaApi.getList({
        page: currentPage.value,
        pageSize: pageSize.value,
        ...params
      })
      personas.value = res.data.list
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 获取画像详情
  async function fetchPersonaDetail(id) {
    loading.value = true
    try {
      const res = await personaApi.getDetail(id)
      currentPersona.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 生成画像
  async function generatePersona(data) {
    generating.value = true
    generationProgress.value = 0
    try {
      const res = await personaApi.generate(data)
      // 添加到列表
      personas.value.unshift(res.data)
      ElMessage.success('画像生成任务已提交')
      return res.data
    } finally {
      generating.value = false
      generationProgress.value = 0
    }
  }

  // 更新画像
  async function updatePersona(id, data) {
    loading.value = true
    try {
      const res = await personaApi.update(id, data)
      const index = personas.value.findIndex(p => p.id === id)
      if (index !== -1) {
        personas.value[index] = { ...personas.value[index], ...data }
      }
      if (currentPersona.value?.id === id) {
        currentPersona.value = { ...currentPersona.value, ...data }
      }
      ElMessage.success('画像更新成功')
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 删除画像
  async function deletePersona(id) {
    loading.value = true
    try {
      await personaApi.delete(id)
      personas.value = personas.value.filter(p => p.id !== id)
      if (currentPersona.value?.id === id) {
        currentPersona.value = null
      }
      ElMessage.success('画像删除成功')
    } finally {
      loading.value = false
    }
  }

  // 设置生成进度
  function setGenerationProgress(progress) {
    generationProgress.value = progress
  }

  // 设置当前画像
  function setCurrentPersona(persona) {
    currentPersona.value = persona
  }

  // 清空当前画像
  function clearCurrentPersona() {
    currentPersona.value = null
  }

  // 分页设置
  function setPage(page, size) {
    currentPage.value = page
    pageSize.value = size
  }

  // 更新列表中的画像状态（用于轮询）
  function updatePersonaStatus(id, status) {
    const index = personas.value.findIndex(p => p.id === id)
    if (index !== -1) {
      personas.value[index].status = status
    }
    if (currentPersona.value?.id === id) {
      currentPersona.value.status = status
    }
  }

  return {
    // 状态
    personas,
    currentPersona,
    loading,
    generating,
    generationProgress,
    total,
    currentPage,
    pageSize,
    // 计算属性
    hasPersonas,
    completedPersonas,
    pendingPersonas,
    // 方法
    fetchPersonas,
    fetchPersonaDetail,
    generatePersona,
    updatePersona,
    deletePersona,
    setGenerationProgress,
    setCurrentPersona,
    clearCurrentPersona,
    setPage,
    updatePersonaStatus
  }
})
