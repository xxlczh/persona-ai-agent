<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <el-avatar :size="80" class="user-avatar">
            {{ userInfo.username?.charAt(0).toUpperCase() }}
          </el-avatar>
        </div>
        <h2>{{ userInfo.nickname || userInfo.username }}</h2>
        <p class="username">@{{ userInfo.username }}</p>
      </div>

      <el-divider />

      <el-form label-width="100px" class="profile-form">
        <el-form-item label="用户ID">
          <span class="field-value">{{ userInfo.id }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <span class="field-value">{{ userInfo.email }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-tag :type="userInfo.role === 'admin' ? 'danger' : 'success'">
            {{ userInfo.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="状态">
          <el-tag type="success">{{ userInfo.status === 'active' ? '正常' : userInfo.status }}</el-tag>
        </el-form-item>
        <el-form-item label="注册时间">
          <span class="field-value">{{ formatDate(userInfo.createdAt) }}</span>
        </el-form-item>
        <el-form-item label="最后登录">
          <span class="field-value">{{ formatDate(userInfo.last_login_at) }}</span>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="profile-actions">
        <el-button type="primary" @click="goBack">返回项目列表</el-button>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userInfo = ref({})

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    userInfo.value = JSON.parse(userStr)
  } else {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/projects')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 20px;
  background-color: #f5f7fa;
}

.profile-card {
  width: 600px;
}

.profile-header {
  text-align: center;
  padding: 20px 0;
}

.avatar-wrapper {
  margin-bottom: 20px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 32px;
}

.profile-header h2 {
  margin: 0 0 8px;
  color: #333;
}

.username {
  color: #999;
  margin: 0;
}

.profile-form {
  padding: 20px;
}

.field-value {
  color: #666;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}
</style>
