<template>
  <div class="dashboard-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>仪表盘</h2>
          <div class="user-info">
            <span>欢迎，{{ username }}</span>
            <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            router
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>概览</span>
            </el-menu-item>
            <el-menu-item index="/projects">
              <el-icon><Folder /></el-icon>
              <span>项目管理</span>
            </el-menu-item>
            <el-menu-item index="/profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-icon" style="background-color: #409eff;">
                  <el-icon :size="30"><Folder /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.totalProjects }}</div>
                  <div class="stat-label">项目总数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-icon" style="background-color: #67c23a;">
                  <el-icon :size="30"><SuccessFilled /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.completedProjects }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-icon" style="background-color: #e6a23c;">
                  <el-icon :size="30"><Loading /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.processingProjects }}</div>
                  <div class="stat-label">处理中</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-icon" style="background-color: #f56c6c;">
                  <el-icon :size="30"><WarningFilled /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ stats.failedProjects }}</div>
                  <div class="stat-label">失败</div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>最近项目</span>
                  </div>
                </template>
                <el-table :data="recentProjects" style="width: 100%">
                  <el-table-column prop="name" label="项目名称" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                      <el-tag :type="getStatusType(scope.row.status)">
                        {{ getStatusText(scope.row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间" width="180" />
                </el-table>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>快速操作</span>
                  </div>
                </template>
                <div class="quick-actions">
                  <el-button type="primary" @click="handleCreateProject">
                    <el-icon><Plus /></el-icon>
                    新建项目
                  </el-button>
                  <el-button type="success" @click="handleImportData">
                    <el-icon><Upload /></el-icon>
                    导入数据
                  </el-button>
                  <el-button type="info" @click="handleViewReports">
                    <el-icon><Document /></el-icon>
                    查看报告
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Folder,
  User,
  SuccessFilled,
  Loading,
  WarningFilled,
  Plus,
  Upload,
  Document
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const username = ref('用户')

const activeMenu = computed(() => route.path)

const stats = ref({
  totalProjects: 0,
  completedProjects: 0,
  processingProjects: 0,
  failedProjects: 0
})

const recentProjects = ref([])

const getStatusType = (status) => {
  const types = {
    completed: 'success',
    processing: 'warning',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    completed: '已完成',
    processing: '处理中',
    failed: '失败'
  }
  return texts[status] || '未知'
}

const handleLogout = () => {
  ElMessage.success('已退出登录')
  router.push('/login')
}

const handleCreateProject = () => {
  router.push('/projects')
}

const handleImportData = () => {
  ElMessage.info('导入数据功能开发中')
}

const handleViewReports = () => {
  ElMessage.info('查看报告功能开发中')
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.card-header {
  font-weight: bold;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.quick-actions .el-button {
  width: 100%;
  justify-content: flex-start;
}
</style>
