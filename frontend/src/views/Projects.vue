<template>
  <div class="projects-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>项目管理</h2>
          <el-button type="primary" @click="handleCreate">新建项目</el-button>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="8" v-for="project in projects" :key="project.id">
            <el-card class="project-card" @click="goToProject(project.id)">
              <template #header>
                <div class="card-header">
                  <span>{{ project.name }}</span>
                </div>
              </template>
              <p>{{ project.description }}</p>
              <div class="project-info">
                <span>创建时间: {{ project.createdAt }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const projects = ref([])

const handleCreate = () => {
  // TODO: 实现创建项目逻辑
}

const goToProject = (id) => {
  router.push(`/project/${id}`)
}
</script>

<style scoped>
.projects-container {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-card {
  margin-bottom: 20px;
  cursor: pointer;
}

.card-header {
  font-weight: bold;
}

.project-info {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
</style>
