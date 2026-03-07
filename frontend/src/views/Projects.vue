<template>
  <div class="projects-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>项目管理</h2>
          <div class="header-right">
            <el-button type="primary" @click="dialogVisible = true">新建项目</el-button>
            <el-dropdown @command="handleUserCommand">
              <div class="user-dropdown">
                <el-avatar :size="36" class="user-avatar">
                  {{ currentUser.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ currentUser.nickname || currentUser.username }}</span>
                <el-icon><arrow-down /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人主页
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="projects.length === 0" class="empty-container">
          <el-empty description="暂无项目，点击新建项目开始创建">
            <el-button type="primary" @click="dialogVisible = true">新建项目</el-button>
          </el-empty>
        </div>
        <el-row v-else :gutter="20">
          <el-col :span="8" v-for="project in projects" :key="project.id">
            <el-card class="project-card" @click="goToProject(project.id)">
              <template #header>
                <div class="card-header">
                  <span>{{ project.name }}</span>
                  <el-tag size="small" :type="getStatusType(project.status)">
                    {{ getStatusText(project.status) }}
                  </el-tag>
                </div>
              </template>
              <p>{{ project.description || '暂无描述' }}</p>
              <div class="project-info">
                <span>创建时间: {{ formatDate(project.createdAt) }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <!-- 新建项目对话框 -->
    <el-dialog v-model="dialogVisible" title="新建项目" width="500px">
      <el-form :model="projectForm" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="行业" prop="industry">
          <el-input v-model="projectForm.industry" placeholder="请输入所属行业" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProject" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, User, SwitchButton } from '@element-plus/icons-vue'
import request from '@/api/request'

const router = useRouter()

const projects = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 当前用户信息
const currentUser = reactive({
  username: '',
  nickname: '',
  email: ''
})

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    currentUser.username = user.username
    currentUser.nickname = user.nickname
    currentUser.email = user.email
  }
}

// 处理用户菜单命令
const handleUserCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

const projectForm = ref({
  name: '',
  description: '',
  industry: ''
})

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 100, message: '项目名称长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}

// 获取项目列表
const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/projects')
    projects.value = res.data?.projects || []
  } catch (error) {
    console.error('获取项目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建项目
const submitProject = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post('/api/projects', {
      name: projectForm.value.name,
      description: projectForm.value.description,
      industry: projectForm.value.industry
    })

    ElMessage.success('项目创建成功')
    dialogVisible.value = false
    projectForm.value = { name: '', description: '', industry: '' }
    fetchProjects()
  } catch (error) {
    console.error('创建项目失败:', error)
  } finally {
    submitting.value = false
  }
}

const goToProject = (id) => {
  router.push(`/project/${id}`)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    'draft': 'info',
    'active': 'success',
    'archived': 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'active': '活跃',
    'archived': '已归档'
  }
  return map[status] || status
}

onMounted(() => {
  getCurrentUser()
  fetchProjects()
})
</script>

<style scoped>
.projects-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.username {
  color: #333;
  font-size: 14px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.project-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.project-info {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
</style>
