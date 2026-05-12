<template>
  <div class="favorites-container">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">我的收藏</span>
      </template>
    </el-page-header>

    <el-tabs v-model="activeTab" @tab-change="loadFavorites" class="favorites-tabs">
      <el-tab-pane label="用户画像" name="personas">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="personas.length === 0" class="empty">
          <el-empty description="暂无收藏的用户画像">
            <el-button type="primary" @click="goToProjects">去生成一个</el-button>
          </el-empty>
        </div>
        <div v-else class="favorite-list">
          <el-card
            v-for="item in personas"
            :key="item.id"
            class="favorite-item"
            shadow="hover"
          >
            <template #header>
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <el-tag v-if="item.quality_score" size="small" type="success">
                  质量评分 {{ ((item.quality_score.overall_score || item.quality_score.overall || 0) * 100).toFixed(0) }}
                </el-tag>
              </div>
            </template>
            <div class="item-content">
              <div v-if="item.summary" class="summary">{{ item.summary.substring(0, 100) }}...</div>
              <div v-if="item.personality_tags?.length" class="tags">
                <el-tag v-for="(tag, i) in item.personality_tags.slice(0, 3)" :key="i" size="small">{{ tag }}</el-tag>
              </div>
            </div>
            <template #footer>
              <div class="item-footer">
                <el-button size="small" type="primary" @click="handleViewPersona(item)">查看详情</el-button>
                <el-button size="small" type="danger" @click="removeFavorite('personas', item.id)">取消收藏</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用研问卷" name="surveys">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="surveys.length === 0" class="empty">
          <el-empty description="暂无收藏的用研问卷">
            <el-button type="primary" @click="goToProjects">去生成一个</el-button>
          </el-empty>
        </div>
        <div v-else class="favorite-list">
          <el-card v-for="item in surveys" :key="item.id" class="favorite-item" shadow="hover">
            <template #header>
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <el-tag size="small" type="info">{{ item.questions?.length || 0 }}题</el-tag>
              </div>
            </template>
            <div class="item-content">
              <div v-if="item.persona_name" class="source-info">来自画像：<span class="source-name">{{ item.persona_name }}</span></div>
              <div v-if="item.description" class="summary">{{ item.description.substring(0, 80) }}...</div>
            </div>
            <template #footer>
              <div class="item-footer">
                <el-button size="small" type="primary" @click="handleViewSurvey(item)">查看详情</el-button>
                <el-button size="small" type="danger" @click="removeFavorite('surveys', item.id)">取消收藏</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="营销脚本" name="scripts">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="scripts.length === 0" class="empty">
          <el-empty description="暂无收藏的营销脚本">
            <el-button type="primary" @click="goToProjects">去生成一个</el-button>
          </el-empty>
        </div>
        <div v-else class="favorite-list">
          <el-card v-for="item in scripts" :key="item.id" class="favorite-item" shadow="hover">
            <template #header>
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <el-tag size="small" type="info">{{ item.type }}</el-tag>
              </div>
            </template>
            <div class="item-content">
              <div v-if="item.persona_name" class="source-info">来自画像：<span class="source-name">{{ item.persona_name }}</span></div>
              <div v-if="item.content?.scenes?.length" class="scene-count">包含 {{ item.content.scenes.length }} 个镜头</div>
            </div>
            <template #footer>
              <div class="item-footer">
                <el-button size="small" type="primary" @click="handleViewScript(item)">查看详情</el-button>
                <el-button size="small" type="danger" @click="removeFavorite('scripts', item.id)">取消收藏</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="产品建议" name="suggestions">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="suggestions.length === 0" class="empty">
          <el-empty description="暂无收藏的产品建议">
            <el-button type="primary" @click="goToProjects">去生成一个</el-button>
          </el-empty>
        </div>
        <div v-else class="favorite-list">
          <el-card v-for="item in suggestions" :key="item.id" class="favorite-item" shadow="hover">
            <template #header>
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <el-tag v-if="item.confidence_score" size="small" type="success">置信度 {{ (item.confidence_score * 100).toFixed(0) }}%</el-tag>
              </div>
            </template>
            <div class="item-content">
              <div v-if="item.persona_name" class="source-info">来自画像：<span class="source-name">{{ item.persona_name }}</span></div>
              <div v-if="item.summary" class="summary">{{ item.summary.substring(0, 100) }}...</div>
            </div>
            <template #footer>
              <div class="item-footer">
                <el-button size="small" type="primary" @click="handleViewSuggestion(item)">查看详情</el-button>
                <el-button size="small" type="danger" @click="removeFavorite('suggestions', item.id)">取消收藏</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="personaDialogVisible" :title="currentPersona?.name" width="900px" top="5vh">
      <ResultDisplay v-if="currentPersona" :persona="currentPersona" @export="handleExportPersona" />
    </el-dialog>

    <!-- 用研问卷详情弹窗 -->
    <el-dialog v-model="surveyDialogVisible" :title="currentItem?.name" width="800px" top="5vh">
      <div v-if="currentItem" class="survey-detail">
        <div class="detail-meta">
          <el-tag v-if="currentItem.persona_name" size="small">来自画像：{{ currentItem.persona_name }}</el-tag>
          <el-tag size="small" type="info">{{ currentItem.questions?.length || 0 }}题</el-tag>
          <el-tag v-if="currentItem.settings?.estimatedTime" size="small">约{{ currentItem.settings.estimatedTime }}分钟</el-tag>
        </div>
        <div v-if="currentItem.description" class="detail-intro">
          <p><strong>引言：</strong>{{ currentItem.description }}</p>
        </div>
        <div v-if="currentItem.questions" class="detail-questions">
          <div v-for="(q, i) in currentItem.questions" :key="i" class="question-item">
            <div class="question-text">{{ i + 1 }}. {{ q.question_text }}</div>
            <div v-if="q.options" class="question-options">
              <div v-for="(opt, j) in q.options" :key="j" class="option-item">{{ opt }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 营销脚本详情弹窗 -->
    <el-dialog v-model="scriptDialogVisible" :title="currentItem?.name" width="800px" top="5vh">
      <div v-if="currentItem" class="script-detail">
        <div class="detail-meta">
          <el-tag v-if="currentItem.persona_name" size="small">来自画像：{{ currentItem.persona_name }}</el-tag>
          <el-tag size="small">{{ currentItem.type }}</el-tag>
        </div>
        <div v-if="currentItem.content?.scenes" class="detail-scenes">
          <div v-for="(scene, i) in currentItem.content.scenes" :key="i" class="scene-item">
            <div class="scene-header">镜头 {{ i + 1 }} ({{ scene.time_range }}) - {{ scene.shot_type }}</div>
            <div class="scene-desc">{{ scene.description }}</div>
            <div v-if="scene.dialogue" class="scene-dialogue">台词：{{ scene.dialogue }}</div>
            <div v-if="scene.bgm_suggestion" class="scene-bgm">BGM：{{ scene.bgm_suggestion }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 产品建议详情弹窗 -->
    <el-dialog v-model="suggestionDialogVisible" :title="currentItem?.name" width="900px" top="5vh">
      <div v-if="currentItem" class="suggestion-detail">
        <div class="detail-meta">
          <el-tag v-if="currentItem.persona_name" size="small">来自画像：{{ currentItem.persona_name }}</el-tag>
          <el-tag v-if="currentItem.confidence_score" size="small" type="success">置信度 {{ (currentItem.confidence_score * 100).toFixed(0) }}%</el-tag>
        </div>
        <div v-if="currentItem.summary" class="detail-summary">{{ currentItem.summary }}</div>
        <div v-if="currentItem.competitor_analysis?.competitors?.length" class="detail-competitor">
          <h4>竞品分析</h4>
          <p v-if="currentItem.competitor_analysis.summary" class="comp-summary">{{ currentItem.competitor_analysis.summary }}</p>
          <div v-for="(comp, i) in currentItem.competitor_analysis.competitors" :key="i" class="competitor-item">
            <div class="competitor-name">{{ comp.name }}</div>
            <div class="comp-strengths">
              <el-tag size="small" type="success" style="margin-right: 4px">优势</el-tag>
              {{ comp.strengths?.join(', ') }}
            </div>
            <div class="comp-weaknesses">
              <el-tag size="small" type="danger" style="margin-right: 4px">劣势</el-tag>
              {{ comp.weaknesses?.join(', ') }}
            </div>
          </div>
        </div>
        <div v-if="currentItem.suggestions" class="detail-suggestions">
          <h4>功能建议</h4>
          <div v-for="(s, i) in currentItem.suggestions" :key="i" class="suggestion-item">
            <div class="suggestion-title">{{ i + 1 }}. {{ s.feature_name }} <el-tag size="small" :type="s.priority === 'high' ? 'danger' : 'warning'">{{ s.priority }}</el-tag></div>
            <div class="suggestion-desc">{{ s.feature_description }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marketingScriptApi, productSuggestionApi, surveyApi, personaApi } from '@/api'
import ResultDisplay from '@/components/ResultDisplay.vue'

const router = useRouter()
const activeTab = ref('personas')
const loading = ref(false)
const personas = ref([])
const surveys = ref([])
const scripts = ref([])
const suggestions = ref([])

const personaDialogVisible = ref(false)
const currentPersona = ref(null)
const surveyDialogVisible = ref(false)
const scriptDialogVisible = ref(false)
const suggestionDialogVisible = ref(false)
const currentItem = ref(null)

const channelMap = { douyin: '抖音', kuaishou: '快手', wechat: '微信', weibo: '微博', xiaohongshu: '小红书', feeds: '信息流' }
const getChannelName = (channel) => channelMap[channel] || channel

const goBack = () => router.back()
const goToProjects = () => router.push('/projects')
const goToPersonaDetail = (id) => router.push(`/persona/${id}`)

const loadFavorites = async () => {
  if (activeTab.value === 'personas') {
    loading.value = true
    personas.value = []
    const favoriteIds = JSON.parse(localStorage.getItem('favoritePersonas') || '[]')
    if (favoriteIds.length > 0) {
      for (const id of favoriteIds) {
        try {
          const res = await personaApi.getDetail(id)
          personas.value.push(res.data)
        } catch (e) {
          personas.value.push({ id, name: `画像 #${id}` })
        }
      }
    }
    loading.value = false
  } else if (activeTab.value === 'surveys') {
    loading.value = true
    surveys.value = []
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteSurveys') || '[]')
    if (favoriteIds.length > 0) {
      for (const id of favoriteIds) {
        try {
          const res = await surveyApi.getDetail(id)
          const item = res.data
          if (item.persona_id) {
            try {
              const personaRes = await personaApi.getDetail(item.persona_id)
              item.persona_name = personaRes.data?.name || `画像 #${item.persona_id}`
            } catch (e) {
              item.persona_name = `画像 #${item.persona_id}`
            }
          }
          surveys.value.push(item)
        } catch (e) {
          surveys.value.push({ id, name: `问卷 #${id}` })
        }
      }
    }
    loading.value = false
  } else if (activeTab.value === 'scripts') {
    loading.value = true
    scripts.value = []
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteScripts') || '[]')
    if (favoriteIds.length > 0) {
      for (const id of favoriteIds) {
        try {
          const res = await marketingScriptApi.getDetail(id)
          const item = res.data
          if (item.persona_id) {
            try {
              const personaRes = await personaApi.getDetail(item.persona_id)
              item.persona_name = personaRes.data?.name || `画像 #${item.persona_id}`
            } catch (e) {
              item.persona_name = `画像 #${item.persona_id}`
            }
          }
          scripts.value.push(item)
        } catch (e) {
          scripts.value.push({ id, name: `脚本 #${id}`, type: 'video' })
        }
      }
    }
    loading.value = false
  } else {
    loading.value = true
    suggestions.value = []
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteSuggestions') || '[]')
    if (favoriteIds.length > 0) {
      for (const id of favoriteIds) {
        try {
          const res = await productSuggestionApi.getDetail(id)
          const item = res.data
          if (item.persona_id) {
            try {
              const personaRes = await personaApi.getDetail(item.persona_id)
              item.persona_name = personaRes.data?.name || `画像 #${item.persona_id}`
            } catch (e) {
              item.persona_name = `画像 #${item.persona_id}`
            }
          }
          suggestions.value.push(item)
        } catch (e) {
          suggestions.value.push({ id, name: `建议 #${id}` })
        }
      }
    }
    loading.value = false
  }
}

const handleViewSurvey = (item) => {
  currentItem.value = item
  surveyDialogVisible.value = true
}

const handleViewPersona = (item) => {
  currentPersona.value = item
  personaDialogVisible.value = true
}

const handleExportPersona = async (persona) => {
  try {
    const res = await personaApi.export(persona.id, {
      format: 'json',
      content: ['all']
    })
    const blob = new Blob([JSON.stringify(res.data || persona, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${persona.name || 'persona'}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleViewScript = (item) => {
  currentItem.value = item
  scriptDialogVisible.value = true
}

const handleViewSuggestion = (item) => {
  currentItem.value = item
  suggestionDialogVisible.value = true
}

const removeFavorite = (type, id) => {
  let key = ''
  if (type === 'personas') key = 'favoritePersonas'
  else if (type === 'surveys') key = 'favoriteSurveys'
  else if (type === 'scripts') key = 'favoriteScripts'
  else key = 'favoriteSuggestions'

  const favoriteIds = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = favoriteIds.indexOf(id)
  if (idx > -1) {
    favoriteIds.splice(idx, 1)
    localStorage.setItem(key, JSON.stringify(favoriteIds))
    if (type === 'personas') personas.value = personas.value.filter(s => s.id !== id)
    else if (type === 'surveys') surveys.value = surveys.value.filter(s => s.id !== id)
    else if (type === 'scripts') scripts.value = scripts.value.filter(s => s.id !== id)
    else suggestions.value = suggestions.value.filter(s => s.id !== id)
    ElMessage.success('已取消收藏')
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.page-title { font-size: 20px; font-weight: 600; }
.favorites-tabs { margin-top: 20px; }
.loading, .empty { padding: 60px 20px; }
.favorite-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.favorite-item { transition: all 0.3s; cursor: pointer; }
.favorite-item:hover { transform: translateY(-2px); }
.item-header { display: flex; justify-content: space-between; align-items: center; }
.item-name { font-weight: 600; font-size: 16px; }
.item-content { min-height: 60px; padding: 10px 0; }
.source-info { font-size: 13px; color: #909399; margin-bottom: 8px; }
.source-name { color: #409eff; font-weight: 500; }
.summary { font-size: 13px; color: #606266; line-height: 1.6; margin-bottom: 8px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.item-footer { display: flex; justify-content: space-between; }
.detail-meta { display: flex; gap: 10px; margin-bottom: 16px; }
.detail-intro { padding: 12px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; }
.detail-questions { max-height: 400px; overflow-y: auto; }
.question-item { padding: 12px 0; border-bottom: 1px solid #ebeef5; }
.question-text { font-weight: 500; margin-bottom: 8px; }
.question-options { padding-left: 20px; }
.option-item { padding: 4px 0; color: #606266; }
.detail-scenes { max-height: 500px; overflow-y: auto; }
.scene-item { padding: 16px; border-bottom: 1px solid #ebeef5; }
.scene-header { font-weight: 600; color: #409eff; margin-bottom: 8px; }
.scene-desc { margin-bottom: 8px; }
.scene-dialogue { color: #67c23a; font-style: italic; }
.scene-bgm { color: #909399; font-size: 13px; }
.detail-summary { padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; line-height: 1.6; }
.detail-suggestions h4 { margin: 0 0 12px; color: #409eff; }
.suggestion-item { padding: 12px; background: #f5f7fa; border-radius: 8px; margin-bottom: 12px; }
.suggestion-title { font-weight: 600; margin-bottom: 8px; }
.suggestion-desc { font-size: 13px; color: #606266; line-height: 1.5; }
.detail-competitor h4 { margin: 0 0 12px; color: #409eff; }
.competitor-item { padding: 12px; background: white; border-radius: 4px; margin-bottom: 8px; }
.competitor-name { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
.comp-strengths, .comp-weaknesses { font-size: 13px; margin-bottom: 4px; }
.comp-summary { margin-bottom: 16px; font-size: 14px; }
</style>
