<template>
  <div class="extension-history">
    <el-tabs v-model="activeType" @tab-change="fetchData">
      <el-tab-pane label="用研问卷" name="survey" />
      <el-tab-pane label="营销脚本" name="script" />
      <el-tab-pane label="产品建议" name="suggestion" />
    </el-tabs>

    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      加载中...
    </div>

    <div v-else-if="items.length === 0" class="empty">
      <el-empty description="暂无历史记录" />
    </div>

    <div v-else class="history-list">
      <el-card
        v-for="item in items"
        :key="item.id"
        class="history-item"
        shadow="hover"
      >
        <div class="item-header">
          <h4>{{ item.name }}</h4>
          <el-tag size="small" type="info">{{ formatDate(item.created_at) }}</el-tag>
        </div>
        <div class="item-summary">
          {{ getSummary(item) }}
        </div>
        <div class="item-actions">
          <el-button size="small" type="primary" @click.stop="handleView(item)">查看</el-button>
          <el-button size="small" :type="isFavorited(item.id) ? 'warning' : ''" @click.stop="handleToggleFavorite(item)">{{ isFavorited(item.id) ? '已收藏' : '收藏' }}</el-button>
          <el-button size="small" :type="isShared(item.id) ? 'success' : ''" @click.stop="handleToggleShare(item)">{{ isShared(item.id) ? '已分享' : '分享' }}</el-button>
          <el-button size="small" @click="handleExport(item)">导出</el-button>
        </div>
      </el-card>
    </div>

    <!-- 问卷详情弹窗 -->
    <el-dialog v-model="surveyDialogVisible" :title="currentItem?.name" width="800px" top="5vh">
      <div v-if="currentItem" class="detail-content">
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
      <div v-if="currentItem" class="detail-content">
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
      <div v-if="currentItem" class="detail-content">
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
import { ref } from 'vue'
import { surveyApi, marketingScriptApi, productSuggestionApi, personaApi } from '@/api'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const props = defineProps({
  projectId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const items = ref([])
const activeType = ref('survey')
const favoriteIds = ref([])
const sharedIds = ref([])

const surveyDialogVisible = ref(false)
const scriptDialogVisible = ref(false)
const suggestionDialogVisible = ref(false)
const currentItem = ref(null)

const fetchData = async () => {
  loading.value = true
  loadFavorites()
  items.value = []
  try {
    if (activeType.value === 'survey') {
      const res = await surveyApi.getList(props.projectId)
      items.value = res.data?.rows || res.data || []
    } else if (activeType.value === 'script') {
      const res = await marketingScriptApi.getList(props.projectId)
      items.value = res.data?.rows || res.data || []
    } else {
      const res = await productSuggestionApi.getList(props.projectId)
      items.value = res.data?.rows || res.data || []
    }
    await checkShareStatus()
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

const getSummary = (item) => {
  if (item.description) return item.description.substring(0, 100)
  if (item.summary) return item.summary.substring(0, 100)
  if (item.content?.scenes?.length) {
    return `包含 ${item.content.scenes.length} 个镜头`
  }
  if (item.suggestions?.length) {
    return `包含 ${item.suggestions.length} 条建议`
  }
  if (item.questions?.length) {
    return `包含 ${item.questions.length} 道题目`
  }
  return ''
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleView = async (item) => {
  try {
    if (activeType.value === 'survey') {
      const res = await surveyApi.getDetail(item.id)
      currentItem.value = res.data
    } else if (activeType.value === 'script') {
      const res = await marketingScriptApi.getDetail(item.id)
      currentItem.value = res.data
    } else {
      const res = await productSuggestionApi.getDetail(item.id)
      currentItem.value = res.data
    }
    if (currentItem.value?.persona_id) {
      try {
        const personaRes = await personaApi.getDetail(currentItem.value.persona_id)
        currentItem.value.persona_name = personaRes.data?.name || `画像 #${currentItem.value.persona_id}`
      } catch (e) {
        currentItem.value.persona_name = `画像 #${currentItem.value.persona_id}`
      }
    }
  } catch (e) {
    currentItem.value = item
  }
  if (activeType.value === 'survey') {
    surveyDialogVisible.value = true
  } else if (activeType.value === 'script') {
    scriptDialogVisible.value = true
  } else {
    suggestionDialogVisible.value = true
  }
}

const handleExport = (item) => {
  let content, filename, type

  if (activeType.value === 'survey') {
    content = JSON.stringify(item, null, 2)
    filename = `${item.name}.json`
    type = 'application/json'
  } else if (activeType.value === 'script') {
    content = JSON.stringify(item, null, 2)
    filename = `${item.name}.json`
    type = 'application/json'
  } else {
    content = JSON.stringify(item, null, 2)
    filename = `${item.name}.json`
    type = 'application/json'
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  ElMessage.success('导出成功')
}

const getFavoriteKey = () => {
  if (activeType.value === 'survey') return 'favoriteSurveys'
  if (activeType.value === 'script') return 'favoriteScripts'
  return 'favoriteSuggestions'
}

const loadFavorites = () => {
  favoriteIds.value = JSON.parse(localStorage.getItem(getFavoriteKey()) || '[]')
}

const isFavorited = (id) => {
  return favoriteIds.value.includes(id)
}

const handleToggleFavorite = (item) => {
  const key = getFavoriteKey()
  const favorites = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = favorites.indexOf(item.id)
  if (idx > -1) {
    favorites.splice(idx, 1)
    localStorage.setItem(key, JSON.stringify(favorites))
    ElMessage.success('已取消收藏')
  } else {
    favorites.push(item.id)
    localStorage.setItem(key, JSON.stringify(favorites))
    ElMessage.success('已收藏')
  }
  favoriteIds.value = favorites
}

const getShareType = () => {
  if (activeType.value === 'survey') return 'survey'
  if (activeType.value === 'script') return 'script'
  return 'suggestion'
}

const checkShareStatus = async () => {
  if (items.value.length === 0) return
  try {
    const res = await request.get('/api/shares/my')
    const shares = res.data?.items || []
    sharedIds.value = shares
      .filter(s => s.type === getShareType())
      .map(s => s.resource_id)
  } catch (e) {
    console.error('检查分享状态失败:', e)
  }
}

const isShared = (id) => {
  return sharedIds.value.includes(id)
}

const handleToggleShare = async (item) => {
  const type = getShareType()
  try {
    if (isShared(item.id)) {
      // 取消分享
      await request.delete(`/api/shares/${type}/${item.id}`)
      ElMessage.success('已取消分享')
      sharedIds.value = sharedIds.value.filter(id => id !== item.id)
    } else {
      // 分享
      await request.post('/api/shares', {
        resource_type: type,
        resource_id: item.id
      })
      ElMessage.success('已分享到作品广场')
      sharedIds.value.push(item.id)
    }
  } catch (e) {
    ElMessage.error(isShared(item.id) ? '取消分享失败' : '分享失败')
  }
}

defineExpose({ fetchData })
</script>

<style scoped>
.extension-history {
  padding: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty {
  padding: 40px;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.history-item {
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.item-summary {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  min-height: 40px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

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
.detail-competitor { margin-top: 16px; padding: 16px; background: #f5f7fa; border-radius: 8px; }
.detail-competitor h4 { margin: 0 0 12px; color: #409eff; font-size: 14px; }
.comp-summary { margin-bottom: 16px; font-size: 14px; }
.competitor-item { padding: 12px; background: white; border-radius: 4px; margin-bottom: 8px; }
.competitor-name { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
.comp-strengths, .comp-weaknesses { font-size: 13px; margin-bottom: 4px; }
</style>
