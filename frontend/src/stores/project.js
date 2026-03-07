import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import projectApi from '../api/projects'
import { ElMessage } from 'element-plus'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref([])
  const currentProject = ref(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const hasProjects = computed(() => projects.value.length > 0)
  const activeProjects = computed(() =>
    projects.value.filter(p => p.status === 'active')
  )

  // 获取项目列表
  async function fetchProjects(params = {}) {
    loading.value = true
    try {
      const res = await projectApi.getList({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      projects.value = res.data.list
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 获取项目详情
  async function fetchProjectDetail(id) {
    loading.value = true
    try {
      const res = await projectApi.getDetail(id)
      currentProject.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  async function createProject(data) {
    loading.value = true
    try {
      const res = await projectApi.create(data)
      projects.value.unshift(res.data)
      ElMessage.success('项目创建成功')
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 更新项目
  async function updateProject(id, data) {
    loading.value = true
    try {
      const res = await projectApi.update(id, data)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...data }
      }
      if (currentProject.value?.id === id) {
        currentProject.value = { ...currentProject.value, ...data }
      }
      ElMessage.success('项目更新成功')
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 删除项目
  async function deleteProject(id) {
    loading.value = true
    try {
      await projectApi.delete(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
      ElMessage.success('项目删除成功')
    } finally {
      loading.value = false
    }
  }

  // 归档项目
  async function archiveProject(id) {
    loading.value = true
    try {
      await projectApi.archive(id)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index].status = 'archived'
      }
      ElMessage.success('项目归档成功')
    } finally {
      loading.value = false
    }
  }

  // 设置当前项目
  function setCurrentProject(project) {
    currentProject.value = project
  }

  // 清空当前项目
  function clearCurrentProject() {
    currentProject.value = null
  }

  // 分页设置
  function setPage(page, size) {
    currentPage.value = page
    pageSize.value = size
  }

  return {
    // 状态
    projects,
    currentProject,
    loading,
    total,
    currentPage,
    pageSize,
    // 计算属性
    hasProjects,
    activeProjects,
    // 方法
    fetchProjects,
    fetchProjectDetail,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    setCurrentProject,
    clearCurrentProject,
    setPage
  }
})
