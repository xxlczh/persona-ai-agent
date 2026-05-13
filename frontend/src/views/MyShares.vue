<template>
  <div class="my-shares-container">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">我的分享</span>
      </template>
      <template #extra>
        <el-button type="primary" plain @click="goToGallery">作品广场</el-button>
      </template>
    </el-page-header>

    <el-alert
      title="你分享的作品将被展示在作品广场供其他用户浏览和收藏"
      type="info"
      :closable="false"
      style="margin: 20px 0;"
    />

    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="items.length === 0" class="empty">
      <el-empty description="你还没有分享任何作品">
        <el-button type="primary" @click="goToProjects">去生成一个</el-button>
      </el-empty>
    </div>
    <div v-else class="share-list">
      <el-card
        v-for="item in items"
        :key="item.id"
        class="share-item"
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
          <div v-if="item.summary" class="summary">{{ item.summary.substring(0, 100) }}{{ item.summary.length > 100 ? '...' : '' }}</div>
          <div v-if="item.personality_tags?.length" class="tags">
            <el-tag v-for="(tag, i) in item.personality_tags.slice(0, 3)" :key="i" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>
        <template #footer>
          <div class="item-footer">
            <span class="create-time">分享于 {{ formatDate(item.created_at) }}</span>
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="handleView(item)">查看</el-button>
              <el-button size="small" type="danger" @click="handleUnshare(item)">取消分享</el-button>
            </div>
          </div>
        </template>
      </el-card>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentItem?.name" width="900px" top="5vh">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-meta">
          <el-tag>{{ getTypeName(currentItem.type) }}</el-tag>
          <span class="create-time">{{ formatDate(currentItem.created_at) }}</span>
        </div>
        <div v-if="currentItem.summary" class="detail-summary">{{ currentItem.summary }}</div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const loading = ref(false)
const items = ref([])
const detailVisible = ref(false)
const currentItem = ref(null)

const goBack = () => router.back()
const goToGallery = () => router.push('/gallery')
const goToProjects = () => router.push('/projects')

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

const loadShares = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/shares/my')
    items.value = res.data?.items || []
  } catch (error) {
    console.error('获取分享列表失败:', error)
    ElMessage.error('获取分享列表失败')
  } finally {
    loading.value = false
  }
}

const handleView = (item) => {
  currentItem.value = item
  detailVisible.value = true
}

const handleUnshare = async (item) => {
  try {
    await ElMessageBox.confirm('确定要取消分享吗？取消后将从作品广场移除。', '确认取消', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const typeMap = { persona: 'persona', survey: 'survey', script: 'script', suggestion: 'suggestion' }
    await request.delete(`/api/shares/${typeMap[item.type]}/${item.resource_id}`)
    ElMessage.success('已取消分享')
    loadShares()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消分享失败')
    }
  }
}

onMounted(() => {
  loadShares()
})
</script>

<style scoped>
.my-shares-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.page-title { font-size: 20px; font-weight: 600; }
.loading, .empty { padding: 60px 20px; }
.share-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-top: 20px; }
.share-item { transition: all 0.3s; }
.share-item:hover { transform: translateY(-2px); }
.item-header { display: flex; justify-content: space-between; align-items: center; }
.item-name { font-weight: 600; font-size: 16px; }
.item-content { min-height: 60px; padding: 10px 0; }
.summary { font-size: 13px; color: #606266; line-height: 1.6; margin-bottom: 8px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.item-footer { display: flex; justify-content: space-between; align-items: center; }
.create-time { font-size: 12px; color: #909399; }
.action-buttons { display: flex; gap: 8px; }
.detail-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.detail-summary { padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; line-height: 1.6; }
.detail-tags { display: flex; flex-wrap: wrap; gap: 8px; }
</style>