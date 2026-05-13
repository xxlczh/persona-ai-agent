<template>
  <div class="project-detail-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <el-button @click="goBack">返回</el-button>
          <h2>项目详情</h2>
          <el-tag v-if="projectMode" :type="getModeTagType(projectMode)">
            {{ getModeText(projectMode) }}
          </el-tag>
          <div class="header-actions" v-if="isOwner">
            <el-dropdown @command="handleProjectCommand" trigger="click">
              <el-button type="primary" plain>
                项目管理
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="projectStatus === 'archived'" command="unarchive">
                    <el-icon><Unlock /></el-icon>
                    解除归档
                  </el-dropdown-item>
                  <el-dropdown-item v-else command="archive">
                    <el-icon><Box /></el-icon>
                    归档项目
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" style="color: #f56c6c;">
                    <el-icon><Delete /></el-icon>
                    删除项目
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <el-tabs v-model="activeTab">
          <!-- 精准定制模式：需要上传数据源 -->
          <el-tab-pane v-if="projectMode !== 'simple'" label="数据源" name="sources">
            <div class="tab-content">
              <DataSourceManager v-if="projectId" :project-id="projectId" />
            </div>
          </el-tab-pane>

          <!-- 极简模式：使用自然语言生成 -->
          <el-tab-pane label="画像生成" name="generation">
            <div class="tab-content">
              <!-- 极简模式使用 SimpleModeGenerator -->
              <SimpleModeGenerator
                v-if="projectId && projectMode === 'simple'"
                :project-id="projectId"
                :initial-input="naturalLanguageInput"
                @generated="handlePersonaGenerated"
              />
              <!-- 精准模式使用 PreciseModeGenerator -->
              <PreciseModeGenerator
                v-else-if="projectId && projectMode === 'precise'"
                :project-id="projectId"
                @generated="handlePersonaGenerated"
              />
              <!-- 混合迭代模式使用 HybridModeGenerator -->
              <HybridModeGenerator
                v-else-if="projectId && projectMode === 'hybrid'"
                :project-id="projectId"
                @generated="handlePersonaGenerated"
              />
              <!-- 兜底：原有生成器 -->
              <template v-else>
                <PersonaGenerator
                  v-if="projectId"
                  :project-id="projectId"
                  @generated="handlePersonaGenerated"
                />
              </template>

              <!-- 批量生成（仅精准和混合模式显示） -->
              <!-- 批量生成功能已暂停
              <BatchGenerator
                v-if="projectId && projectMode !== 'simple'"
                :project-id="projectId"
                @generated="handleBatchGenerated"
                @view="handleViewPersona"
              />
              -->
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史画像" name="history">
            <div class="tab-content">
              <PersonaHistory
                v-if="projectId"
                :project-id="projectId"
                @create="activeTab = 'generation'"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="质量评估" name="evaluation">
            <div class="tab-content">
              <EvaluationDashboard
                v-if="projectId"
                :project-id="projectId"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="扩展工具" name="extensions">
            <div class="tab-content">
              <el-tabs v-model="extensionTab" tab-position="left">
                <el-tab-pane label="用研问卷" name="survey">
                  <SurveyGenerator
                    v-if="projectId"
                    :project-id="projectId"
                    :personas="personas"
                  />
                </el-tab-pane>
                <el-tab-pane label="营销脚本" name="marketing">
                  <MarketingScriptGenerator
                    v-if="projectId"
                    :project-id="projectId"
                    :personas="personas"
                  />
                </el-tab-pane>
                <el-tab-pane label="产品建议" name="suggestion">
                  <ProductSuggestionGenerator
                    v-if="projectId"
                    :project-id="projectId"
                    :personas="personas"
                  />
                </el-tab-pane>
                <el-tab-pane label="历史记录" name="history">
                  <ExtensionHistory
                    v-if="projectId"
                    :project-id="projectId"
                  />
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-tab-pane>
          <el-tab-pane label="团队协作" name="team">
            <div class="tab-content">
              <TeamCollaboration :project-id="projectId" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Box, Delete, Unlock } from '@element-plus/icons-vue'
import DataSourceManager from '@/components/DataSourceManager.vue'
import PersonaGenerator from '@/components/PersonaGenerator.vue'
import SimpleModeGenerator from '@/components/SimpleModeGenerator.vue'
import PreciseModeGenerator from '@/components/PreciseModeGenerator.vue'
import HybridModeGenerator from '@/components/HybridModeGenerator.vue'
import BatchGenerator from '@/components/BatchGenerator.vue'
import EvaluationDashboard from '@/components/EvaluationDashboard.vue'
import PersonaHistory from '@/components/PersonaHistory.vue'
import SurveyGenerator from '@/components/SurveyGenerator.vue'
import MarketingScriptGenerator from '@/components/MarketingScriptGenerator.vue'
import ProductSuggestionGenerator from '@/components/ProductSuggestionGenerator.vue'
import ExtensionHistory from '@/components/ExtensionHistory.vue'
import TeamCollaboration from '@/components/TeamCollaboration.vue'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()

const activeTab = ref('sources')
const extensionTab = ref('survey')
const personas = ref([])
const projectMode = ref('')
const projectStatus = ref('')
const naturalLanguageInput = ref('')
const currentUserId = ref(null)
const projectOwnerId = ref(null)

const projectId = computed(() => {
  return parseInt(route.params.id) || null
})

const isOwner = computed(() => {
  // 检查当前用户是否是项目所有者
  return currentUserId.value && projectOwnerId.value && currentUserId.value === projectOwnerId.value
})

// 处理项目操作命令
const handleProjectCommand = async (command) => {
  if (command === 'archive') {
    try {
      await ElMessageBox.confirm('归档后项目团队成员将无法操作该项目，但数据仍保留。', '确认归档', {
        confirmButtonText: '确认归档',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await request.post(`/api/projects/${projectId.value}/archive`)
      ElMessage.success('项目已归档')
      fetchProjectDetail()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('归档失败')
      }
    }
  } else if (command === 'unarchive') {
    try {
      await ElMessageBox.confirm('解除归档后项目团队成员可以继续操作。', '确认解除归档', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await request.post(`/api/projects/${projectId.value}/unarchive`)
      ElMessage.success('项目已解除归档')
      fetchProjectDetail()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('解除归档失败')
      }
    }
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('删除后项目所有数据将无法恢复！', '确认删除', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      })
      await request.delete(`/api/projects/${projectId.value}`)
      ElMessage.success('项目已删除')
      router.push('/projects')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }
}

// 获取项目详情
const fetchProjectDetail = async () => {
  if (!projectId.value) return
  try {
    const res = await request.get(`/api/projects/${projectId.value}`)
    if (res.data?.project) {
      projectMode.value = res.data.project.settings?.mode || 'precise'
      projectStatus.value = res.data.project.status || 'active'
      naturalLanguageInput.value = res.data.project.settings?.naturalLanguageInput || ''
      projectOwnerId.value = res.data.project.owner_id
      // 极简模式默认跳到画像生成
      if (projectMode.value === 'simple') {
        activeTab.value = 'generation'
      }
    }
  } catch (error) {
    console.error('获取项目详情失败:', error)
  }
}

// 获取项目画像列表
const fetchPersonas = async () => {
  if (!projectId.value) return
  try {
    const res = await fetch(`/api/persona/list?projectId=${projectId.value}&limit=100`)
    const data = await res.json()
    personas.value = data.data?.rows || []
  } catch (error) {
    console.error('获取画像列表失败:', error)
  }
}

onMounted(() => {
  // 从 localStorage 获取当前用户信息
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      currentUserId.value = user.id
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  }
  fetchProjectDetail()
  fetchPersonas()
})

const goBack = () => {
  router.push('/projects')
}

const handlePersonaGenerated = (persona) => {
  console.log('画像生成成功:', persona)
}

const handleBatchGenerated = (personas) => {
  console.log('批量生成成功:', personas)
}

const handleViewPersona = (persona) => {
  router.push(`/persona/${persona.id}`)
}

const getModeTagType = (mode) => {
  const map = {
    'precise': 'primary',
    'simple': 'success',
    'hybrid': 'warning'
  }
  return map[mode] || 'info'
}

const getModeText = (mode) => {
  const map = {
    'precise': '精准定制模式',
    'simple': '极简无数据模式',
    'hybrid': '混合迭代模式'
  }
  return map[mode] || '未知模式'
}
</script>

<style scoped>
.project-detail-container {
  height: 100vh;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.tab-content {
  padding: 20px;
}
</style>
