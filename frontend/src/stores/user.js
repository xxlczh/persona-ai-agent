import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '../api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userId = computed(() => user.value?.id)
  const username = computed(() => user.value?.username)
  const nickname = computed(() => user.value?.nickname)
  const avatar = computed(() => user.value?.avatar)

  // 从 localStorage 恢复用户信息
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      localStorage.removeItem('user')
    }
  }

  // 登录
  async function login(credentials) {
    loading.value = true
    try {
      const res = await authApi.login(credentials)
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      ElMessage.success('登录成功')
      return res
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(data) {
    loading.value = true
    try {
      const res = await authApi.register(data)
      ElMessage.success('注册成功，请登录')
      return res
    } finally {
      loading.value = false
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    if (!token.value) return null
    loading.value = true
    try {
      const res = await authApi.getCurrentUser()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res.data
    } catch (error) {
      logout()
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  async function updateProfile(data) {
    loading.value = true
    try {
      const res = await authApi.updateProfile(data)
      user.value = { ...user.value, ...data }
      localStorage.setItem('user', JSON.stringify(user.value))
      ElMessage.success('更新成功')
      return res
    } finally {
      loading.value = false
    }
  }

  // 登出
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    // 状态
    user,
    token,
    loading,
    // 计算属性
    isLoggedIn,
    userId,
    username,
    nickname,
    avatar,
    // 方法
    login,
    register,
    fetchCurrentUser,
    updateProfile,
    logout
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'user']
  }
})
