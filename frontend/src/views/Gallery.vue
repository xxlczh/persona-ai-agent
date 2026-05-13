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
          <div v-if="item.quality_score" class="quality-info">
            <el-rate v-model="item.quality_score" disabled show-score :max="5" />
          </div>
          <div v-if="item.summary" class="summary">{{ item.summary.substring(0, 100) }}{{ item.summary.length > 100 ? '...' : '' }}</div>
          <div v-if="item.personality_tags?.length" class="tags">
            <el-tag v-for="(tag, i) in item.personality_tags.slice(0, 3)" :key="i" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>
        <template #footer>
          <div class="item-footer">
            <span class="create-time">{{ formatDate(item.created_at) }}</span>
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="handleView(item)">查看详情</el-button>
              <el-button size="small" @click="handleFavorite(item)" :icon="isFavorited(item) ? StarFilled : Star">收藏</el-button>
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
        <div v-if="currentItem.summary" class="detail-summary">{{ currentItem.summary }}</div>
        <div v-if="currentItem.quality_score" class="detail-quality">
          <span>质量评分：</span>
          <el-rate v-model="currentItem.quality_score" disabled show-score :max="5" />
        </div>
        <div v-if="currentItem.personality_tags?.length" class="detail-tags">
          <el-tag v-for="(tag, i) in currentItem.personality_tags" :key="i" size="small" style="margin-right: 8px;">{{ tag }}</el-tag>
        </div>
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
  const map = { persona: 'success', survey: 'warning', script: 'info', suggestion: '' }
  return map[type] || ''
}

const getTypeName = (type) => {
  const map = { persona: '用户画像', survey: '用研问卷', script: '营销脚本', suggestion: '产品建议' }
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
      params.append('type', activeTab.value === 'scripts' ? 'script' : activeTab.value)
    }
    params.append('page', currentPage.value)
    params.append('limit', pageSize.value)

    const res = await request.get(`/api/gallery?${params.toString()}`)
    items.value = res.data?.items || []
    total.value = res.data?.pagination?.total || 0
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

const isFavorited = (item) => {
  const key = favoriteKeys[item.type]
  if (!key) return false
  const favorites = JSON.parse(localStorage.getItem(key) || '[]')
  return favorites.includes(item.resource_id)
}

const handleFavorite = (item) => {
  const key = favoriteKeys[item.type]
  if (!key) {
    ElMessage.warning('暂不支持收藏此类型')
    return
  }
  const favorites = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = favorites.indexOf(item.resource_id)
  if (idx > -1) {
    favorites.splice(idx, 1)
    ElMessage.success('已取消收藏')
  } else {
    favorites.push(item.resource_id)
    ElMessage.success('已添加收藏')
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
</style>