<template>
  <div class="project-detail-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <el-button @click="goBack">返回</el-button>
          <h2>项目详情</h2>
        </div>
      </el-header>
      <el-main>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="数据源" name="sources">
            <div class="tab-content">
              <DataSourceManager v-if="projectId" :project-id="projectId" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="画像生成" name="generation">
            <div class="tab-content">
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
import BatchGenerator from '@/components/BatchGenerator.vue'
import EvaluationDashboard from '@/components/EvaluationDashboard.vue'
import SurveyGenerator from '@/components/SurveyGenerator.vue'
import MarketingScriptGenerator from '@/components/MarketingScriptGenerator.vue'
import ProductSuggestionGenerator from '@/components/ProductSuggestionGenerator.vue'
import TeamCollaboration from '@/components/TeamCollaboration.vue'

const router = useRouter()
const route = useRoute()

const activeTab = ref('sources')
const extensionTab = ref('survey')
const personas = ref([])

const projectId = computed(() => {
  return parseInt(route.params.id) || null
})

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
  fetchPersonas()
})

const goBack = () => {
  router.push('/projects')
}

const handlePersonaGenerated = (persona) => {
  console.log('画像生成成功:', persona)
  // 可以跳转到画像列表或质量评估
}

const handleBatchGenerated = (personas) => {
  console.log('批量生成成功:', personas)
}

const handleViewPersona = (persona) => {
  router.push(`/persona/${persona.id}`)
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
