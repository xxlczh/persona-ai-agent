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
              <!-- 精准/混合模式使用原有生成器 -->
              <template v-else>
                <PersonaGenerator
                  v-if="projectId"
                  :project-id="projectId"
                  @generated="handlePersonaGenerated"
                />
                <BatchGenerator
                  v-if="projectId"
                  :project-id="projectId"
                  @generated="handleBatchGenerated"
                  @view="handleViewPersona"
                />
              </template>
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
import DataSourceManager from '@/components/DataSourceManager.vue'
import PersonaGenerator from '@/components/PersonaGenerator.vue'
import SimpleModeGenerator from '@/components/SimpleModeGenerator.vue'
import BatchGenerator from '@/components/BatchGenerator.vue'
import EvaluationDashboard from '@/components/EvaluationDashboard.vue'
import PersonaHistory from '@/components/PersonaHistory.vue'
import SurveyGenerator from '@/components/SurveyGenerator.vue'
import MarketingScriptGenerator from '@/components/MarketingScriptGenerator.vue'
import ProductSuggestionGenerator from '@/components/ProductSuggestionGenerator.vue'
import TeamCollaboration from '@/components/TeamCollaboration.vue'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()

const activeTab = ref('sources')
const extensionTab = ref('survey')
const personas = ref([])
const projectMode = ref('')
const naturalLanguageInput = ref('')

const projectId = computed(() => {
  return parseInt(route.params.id) || null
})

// 获取项目详情
const fetchProjectDetail = async () => {
  if (!projectId.value) return
  try {
    const res = await request.get(`/api/projects/${projectId.value}`)
    if (res.data?.project) {
      projectMode.value = res.data.project.settings?.mode || 'precise'
      naturalLanguageInput.value = res.data.project.settings?.naturalLanguageInput || ''
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
