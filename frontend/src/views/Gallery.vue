<template>
  <div class="gallery-container">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">作品广场</span>
      </template>
      <template #extra>
        <el-button type="primary" @click="goToMyShares">我的分享</el-button>
      </template>
    </el-page-header>

    <el-alert
      title="在这里你可以浏览其他用户分享的优秀作品，也可以分享自己的作品供大家欣赏"
      type="info"
      :closable="false"
      style="margin: 20px 0;"
    />

    <el-tabs v-model="activeTab" @tab-change="loadItems" class="gallery-tabs">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="用户画像" name="personas" />
      <el-tab-pane label="用研问卷" name="surveys" />
      <el-tab-pane label="营销脚本" name="scripts" />
      <el-tab-pane label="产品建议" name="suggestions" />
    </el-tabs>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="items.length === 0" class="empty">
      <el-empty description="暂无分享的作品" />
    </div>
    <div v-else class="gallery-list">
      <el-card
        v-for="item in items"
        :key="item.id + '-' + item.type"
        class="gallery-item"
        shadow="hover"
      >
        <template #header>
          <div class="item-header">
            <span class="item-name">{{ item.name }}</span>
            <el-tag v-if="getTypeTag(item.type)" :type="getTypeTag(item.type)" size="small">
              {{ getTypeName(item.type) }}
            </el-tag>
          </div>
        </template>
        <div class="item-content">
          <div class="creator-info">
            <el-icon><User /></el-icon>
            <span>{{ item.creator?.username || item.creator?.nickname || '匿名用户' }}</span>
          </div>
          <div v-if="getScoreValue(item.quality_score)" class="quality-info">
            <el-rate :model-value="getScoreValue(item.quality_score)" disabled show-score :max="5" />
          </div>
          <div v-if="item.summary" class="summary">{{ truncateSummary(item.summary) }}</div>
          <div v-if="item.personality_tags?.length" class="tags">
            <el-tag v-for="(tag, i) in item.personality_tags.slice(0, 3)" :key="i" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>
        <template #footer>
          <div class="item-footer">
            <span class="create-time">{{ formatDate(item.created_at) }}</span>
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="handleView(item)">查看详情</el-button>
              <el-button size="small" @click="handleFavorite(item)" :type="isFavorited(item) ? 'warning' : ''">
                <el-icon v-if="isFavorited(item)"><StarFilled /></el-icon>
                <el-icon v-else><Star /></el-icon>
                {{ isFavorited(item) ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>
        </template>
      </el-card>
    </div>

    <div v-if="!loading && items.length > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadItems"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentItem?.name" width="900px" top="5vh">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-meta">
          <el-tag>{{ getTypeName(currentItem.type) }}</el-tag>
          <el-tag type="info">
            <el-icon><User /></el-icon>
            {{ currentItem.creator?.username || currentItem.creator?.nickname || '匿名用户' }}
          </el-tag>
          <span class="create-time">{{ formatDate(currentItem.created_at) }}</span>
        </div>

        <!-- 用户画像详情 -->
        <template v-if="currentItem.type === 'persona'">
          <div v-if="currentItem.summary" class="detail-summary">{{ currentItem.summary }}</div>
          <div v-if="currentItem.quality_score" class="detail-quality">
            <span>质量评分：</span>
            <el-rate :model-value="getScoreValue(currentItem.quality_score)" disabled show-score :max="5" />
          </div>
          <div v-if="currentItem.personality_tags?.length" class="detail-tags">
            <el-tag v-for="(tag, i) in currentItem.personality_tags" :key="i" size="small" style="margin-right: 8px;">{{ tag }}</el-tag>
          </div>
        </template>

        <!-- 用研问卷详情 -->
        <template v-if="currentItem.type === 'survey'">
          <div class="detail-meta" style="margin-bottom: 12px;">
            <el-tag v-if="currentItem.persona_name" size="small">来自画像：{{ currentItem.persona_name }}</el-tag>
            <el-tag size="small" type="info">{{ currentItem.questions?.length || 0 }}题</el-tag>
            <el-tag v-if="currentItem.settings?.estimatedTime" size="small">约{{ currentItem.settings.estimatedTime }}分钟</el-tag>
          </div>
          <div v-if="currentItem.description" class="detail-intro">
            <p><strong>引言：</strong>{{ currentItem.description }}</p>
          </div>
          <div v-if="currentItem.questions?.length" class="detail-questions">
            <div v-for="(q, i) in currentItem.questions" :key="i" class="question-item">
              <div class="question-text">{{ i + 1 }}. {{ q.question_text }}</div>
              <div v-if="q.options" class="question-options">
                <div v-for="(opt, j) in q.options" :key="j" class="option-item">{{ opt }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 营销脚本详情 -->
        <template v-if="['script', 'video', 'copy', 'social', 'strategy'].includes(currentItem.type)">
          <div class="detail-meta" style="margin-bottom: 12px;">
            <el-tag v-if="currentItem.persona_name" size="small">来自画像：{{ currentItem.persona_name }}</el-tag>
            <el-tag size="small">{{ getScriptTypeName(currentItem.type) }}</el-tag>
          </div>
          <div v-if="currentItem.content?.scenes" class="detail-scenes">
            <div v-for="(scene, i) in currentItem.content.scenes" :key="i" class="scene-item">
              <div class="scene-header">镜头 {{ i + 1 }} ({{ scene.time_range }}) - {{ scene.shot_type }}</div>
              <div class="scene-desc">{{ scene.description }}</div>
              <div v-if="scene.dialogue" class="scene-dialogue">台词：{{ scene.dialogue }}</div>
              <div v-if="scene.bgm_suggestion" class="scene-bgm">BGM：{{ scene.bgm_suggestion }}</div>
            </div>
          </div>
          <div v-else-if="currentItem.content" class="detail-copy">
            <pre>{{ typeof currentItem.content === 'string' ? currentItem.content : JSON.stringify(currentItem.content, null, 2) }}</pre>
          </div>
        </template>

        <!-- 产品建议详情 -->
        <template v-if="currentItem.type === 'suggestion'">
          <div class="detail-meta" style="margin-bottom: 12px;">
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
          <div v-if="currentItem.suggestions?.length" class="detail-suggestions">
            <h4>功能建议</h4>
            <div v-for="(s, i) in currentItem.suggestions" :key="i" class="suggestion-item">
              <div class="suggestion-title">{{ i + 1 }}. {{ s.feature_name }} <el-tag size="small" :type="s.priority === 'high' ? 'danger' : 'warning'">{{ s.priority }}</el-tag></div>
              <div class="suggestion-desc">{{ s.feature_description }}</div>
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Star, StarFilled } from '@element-plus/icons-vue'
import request from '@/api/request'

const router = useRouter()
const activeTab = ref('all')
const loading = ref(false)
const items = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const detailVisible = ref(false)
const currentItem = ref(null)

// 响应式收藏状态，用于触发UI更新
const favoriteStates = ref({})

// 我的收藏状态
const favoriteKeys = {
  persona: 'favoritePersonas',
  survey: 'favoriteSurveys',
  script: 'favoriteScripts',
  suggestion: 'favoriteSuggestions'
}

const goBack = () => router.back()
const goToMyShares = () => router.push('/my-shares')

const getTypeTag = (type) => {
  const map = { persona: 'success', survey: 'warning', script: 'info', suggestion: '', video: 'info', copy: 'info', social: 'info', strategy: 'info' }
  return map[type] || ''
}

const getTypeName = (type) => {
  const map = { persona: '用户画像', survey: '用研问卷', script: '营销脚本', suggestion: '产品建议', video: '营销脚本', copy: '营销脚本', social: '营销脚本', strategy: '营销脚本' }
  return map[type] || type
}

const getScriptTypeName = (type) => {
  const map = { video: '短视频脚本', copy: '信息流文案', social: '社交文案', strategy: '营销策略' }
  return map[type] || type
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadItems = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (activeTab.value !== 'all') {
      const typeMap = { personas: 'persona', surveys: 'survey', scripts: 'script', suggestions: 'suggestion' }
      params.append('type', typeMap[activeTab.value] || activeTab.value)
    }
    params.append('page', currentPage.value)
    params.append('limit', pageSize.value)

    const res = await request.get(`/api/gallery?${params.toString()}`)
    items.value = res.data?.items || []
    total.value = res.data?.pagination?.total || 0
    loadFavoriteStates()
  } catch (error) {
    console.error('获取作品列表失败:', error)
    ElMessage.error('获取作品列表失败')
  } finally {
    loading.value = false
  }
}

const handleView = (item) => {
  currentItem.value = item
  detailVisible.value = true
}

const getScoreValue = (score) => {
  if (!score) return 0
  if (typeof score === 'number') {
    // 如果 score <= 1，假设它是小数形式（如 0.7 表示 70%），需要乘以 5 转为星星数
    return score <= 1 ? score * 5 : score
  }
  if (typeof score === 'object') {
    const val = score.overall || score.overall_score || score.consistency || 0
    return val <= 1 ? val * 5 : val
  }
  return 0
}

const truncateSummary = (text) => {
  if (!text) return ''
  if (text.length <= 100) return text
  return text.substring(0, 100) + '...'
}

const isFavorited = (item) => {
  const typeMap = { video: 'script', copy: 'script', social: 'script', strategy: 'script' }
  const effectiveType = typeMap[item.type] || item.type
  const stateKey = `${effectiveType}_${item.resource_id}`
  return favoriteStates.value[stateKey] || false
}

const loadFavoriteStates = () => {
  const states = {}
  Object.entries(favoriteKeys).forEach(([type, key]) => {
    const favorites = JSON.parse(localStorage.getItem(key) || '[]')
    favorites.forEach(id => {
      states[`${type}_${id}`] = true
    })
  })
  favoriteStates.value = states
}

const handleFavorite = (item) => {
  const typeMap = { video: 'script', copy: 'script', social: 'script', strategy: 'script' }
  const effectiveType = typeMap[item.type] || item.type
  const key = favoriteKeys[effectiveType]
  if (!key) {
    ElMessage.warning('暂不支持收藏此类型')
    return
  }
  const favorites = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = favorites.indexOf(item.resource_id)
  const stateKey = `${effectiveType}_${item.resource_id}`
  if (idx > -1) {
    favorites.splice(idx, 1)
    ElMessage.success('已取消收藏')
    favoriteStates.value[stateKey] = false
  } else {
    favorites.push(item.resource_id)
    ElMessage.success('已添加收藏')
    favoriteStates.value[stateKey] = true
  }
  localStorage.setItem(key, JSON.stringify(favorites))
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.gallery-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.page-title { font-size: 20px; font-weight: 600; }
.gallery-tabs { margin-top: 20px; }
.loading, .empty { padding: 60px 20px; }
.gallery-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.gallery-item { transition: all 0.3s; cursor: pointer; }
.gallery-item:hover { transform: translateY(-2px); }
.item-header { display: flex; justify-content: space-between; align-items: center; }
.item-name { font-weight: 600; font-size: 16px; }
.item-content { min-height: 80px; padding: 10px 0; }
.creator-info { display: flex; align-items: center; gap: 6px; color: #909399; font-size: 13px; margin-bottom: 8px; }
.quality-info { margin-bottom: 8px; }
.summary { font-size: 13px; color: #606266; line-height: 1.6; margin-bottom: 8px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.item-footer { display: flex; justify-content: space-between; align-items: center; }
.create-time { font-size: 12px; color: #909399; }
.action-buttons { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: center; margin-top: 30px; }
.detail-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.detail-summary { padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; line-height: 1.6; }
.detail-quality { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.detail-tags { display: flex; flex-wrap: wrap; gap: 8px; }
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
.detail-copy pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
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