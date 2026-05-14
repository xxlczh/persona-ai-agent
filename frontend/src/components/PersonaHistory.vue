<template>
  <div class="persona-history">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索画像名称..."
        prefix-icon="Search"
        clearable
        style="width: 240px;"
        @input="handleSearch"
      />
      <el-select
        v-model="filterStatus"
        placeholder="状态筛选"
        clearable
        style="width: 120px;"
        @change="fetchPersonas"
      >
        <el-option label="全部" value="" />
        <el-option label="成功" value="completed" />
        <el-option label="生成中" value="generating" />
        <el-option label="失败" value="failed" />
      </el-select>
      <el-select
        v-model="sortBy"
        style="width: 120px;"
        @change="fetchPersonas"
      >
        <el-option label="最新优先" value="desc" />
        <el-option label="最早优先" value="asc" />
      </el-select>
      <span class="total-count">共 {{ total }} 个画像</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="personas.length === 0" description="暂无画像记录">
      <el-button type="primary" @click="$emit('create')">去生成</el-button>
    </el-empty>

    <!-- 画像列表 -->
    <div v-else class="persona-grid">
      <el-card
        v-for="persona in personas"
        :key="persona.id"
        class="persona-card"
        :class="{ 'persona-failed': persona.status === 'failed' }"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span class="persona-name">{{ persona.name }}</span>
            <el-tag
              :type="getStatusType(persona.status)"
              size="small"
            >
              {{ getStatusText(persona.status) }}
            </el-tag>
          </div>
        </template>

        <div class="card-content">
          <div v-if="persona.summary" class="persona-summary">
            {{ truncateText(persona.summary, 80) }}
          </div>
          <div v-else class="persona-summary placeholder">
            暂无摘要描述
          </div>

          <div class="persona-tags" v-if="persona.personality_tags && persona.personality_tags.length">
            <el-tag
              v-for="(tag, index) in persona.personality_tags.slice(0, 3)"
              :key="index"
              size="small"
              :type="getTagType(index)"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="persona.personality_tags.length > 3" size="small">
              +{{ persona.personality_tags.length - 3 }}
            </el-tag>
          </div>

          <div class="persona-meta">
            <span>{{ formatDate(persona.created_at) }}</span>
            <span v-if="persona.generated_by">by {{ persona.generated_by }}</span>
          </div>
        </div>

        <template #footer>
          <div class="card-footer">
            <el-button size="small" type="primary" text @click.stop="handleView(persona)">
              查看详情
            </el-button>
            <el-button size="small" type="primary" text @click.stop="handleExport(persona)">
              导出
            </el-button>
            <el-button
              size="small"
              :type="isFavorited(persona.id) ? 'warning' : 'info'"
              @click.stop="toggleFavorite(persona)"
            >
              {{ isFavorited(persona.id) ? '已收藏' : '收藏' }}
            </el-button>
            <el-button
              size="small"
              :type="isShared(persona.id) ? 'success' : 'info'"
              @click.stop="toggleShare(persona)"
            >
              {{ isShared(persona.id) ? '已分享' : '分享' }}
            </el-button>
            <el-button size="small" type="danger" text @click.stop="handleDelete(persona)">
              删除
            </el-button>
          </div>
        </template>
      </el-card>
    </div>

    <!-- 分页 -->
    <div v-if="personas.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentPersona?.name"
      width="900px"
      top="5vh"
    >
      <ResultDisplay
        v-if="currentPersona"
        :persona="currentPersona"
        @export="handleExport(currentPersona)"
        @delete="handleDelete(currentPersona)"
        @edit="handleEdit"
      />
    </el-dialog>

    <!-- 编辑对话框 -->
    <PersonaEditor
      v-model="showEditDialog"
      :persona="editingPersona || {}"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Loading } from '@element-plus/icons-vue'
import { personaApi } from '@/api'
import request from '@/api/request'
import ResultDisplay from './ResultDisplay.vue'
import PersonaEditor from './PersonaEditor.vue'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['create', 'view'])

const personas = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const searchKeyword = ref('')
const filterStatus = ref('')
const sortBy = ref('desc')
const favoriteIds = ref([])
const sharedIds = ref([])

const detailDialogVisible = ref(false)
const currentPersona = ref(null)

// 编辑对话框状态
const showEditDialog = ref(false)
const editingPersona = ref(null)

let searchTimer = null

onMounted(() => {
  fetchPersonas()
})

const loadFavorites = () => {
  favoriteIds.value = JSON.parse(localStorage.getItem('favoritePersonas') || '[]')
}

const isFavorited = (personaId) => {
  return favoriteIds.value.includes(personaId)
}

const toggleFavorite = (persona) => {
  const favorites = JSON.parse(localStorage.getItem('favoritePersonas') || '[]')
  const idx = favorites.indexOf(persona.id)
  if (idx > -1) {
    favorites.splice(idx, 1)
    ElMessage.success('已取消收藏')
  } else {
    favorites.push(persona.id)
    ElMessage.success('已收藏到个人中心')
  }
  localStorage.setItem('favoritePersonas', JSON.stringify(favorites))
  favoriteIds.value = favorites
}

const checkShareStatus = async () => {
  try {
    const res = await request.get('/api/shares/my')
    const shares = res.data?.items || []
    sharedIds.value = shares
      .filter(s => s.type === 'persona')
      .map(s => s.resource_id)
  } catch (e) {
    console.error('检查分享状态失败:', e)
  }
}

const isShared = (personaId) => {
  return sharedIds.value.includes(personaId)
}

const toggleShare = async (persona) => {
  try {
    if (isShared(persona.id)) {
      await request.delete(`/api/shares/persona/${persona.id}`)
      ElMessage.success('已取消分享')
      sharedIds.value = sharedIds.value.filter(id => id !== persona.id)
    } else {
      await request.post('/api/shares', {
        resource_type: 'persona',
        resource_id: persona.id
      })
      ElMessage.success('已分享到作品广场')
      sharedIds.value.push(persona.id)
    }
  } catch (e) {
    ElMessage.error(isShared(persona.id) ? '取消分享失败' : '分享失败')
  }
}

const fetchPersonas = async () => {
  loading.value = true
  loadFavorites()
  try {
    const res = await personaApi.getList({
      projectId: props.projectId,
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filterStatus.value || undefined,
      keyword: searchKeyword.value || undefined,
      sort: sortBy.value
    })

    if (res.data) {
      personas.value = res.data.rows || []
      total.value = res.data.total || 0
    }
    await checkShareStatus()
  } catch (error) {
    console.error('获取画像列表失败:', error)
    ElMessage.error('获取画像列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchPersonas()
  }, 300)
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchPersonas()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchPersonas()
}

const handleView = async (persona) => {
  try {
    const res = await personaApi.getDetail(persona.id)
    if (res && res.data) {
      currentPersona.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取画像详情失败:', error)
    ElMessage.error('获取画像详情失败')
  }
}

const handleExport = async (persona) => {
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

const handleDelete = async (persona) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除画像"${persona.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await personaApi.delete(persona.id)
    ElMessage.success('删除成功')
    fetchPersonas()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 编辑
const handleEdit = (persona) => {
  editingPersona.value = persona
  showEditDialog.value = true
}

// 保存编辑
const handleSave = async (data) => {
  try {
    const res = await personaApi.update(editingPersona.value.id, data)
    if (res.success) {
      ElMessage.success('保存成功')
      currentPersona.value = res.data
      // 更新列表中的数据
      const index = personas.value.findIndex(p => p.id === editingPersona.value.id)
      if (index !== -1) {
        personas.value[index] = res.data
      }
      showEditDialog.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const getStatusType = (status) => {
  const map = {
    completed: 'success',
    generating: 'warning',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    completed: '成功',
    generating: '生成中',
    failed: '失败'
  }
  return map[status] || '未知'
}

const getTagType = (index) => {
  const types = ['', 'success', 'warning', 'info']
  return types[index % types.length]
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.persona-history {
  padding: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.total-count {
  margin-left: auto;
  color: #909399;
  font-size: 14px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 60px;
  color: #909399;
}

.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.persona-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.persona-card:hover {
  transform: translateY(-4px);
}

.persona-failed {
  opacity: 0.7;
}

.persona-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.persona-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.persona-card :deep(.el-card__footer) {
  padding: 8px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.persona-name {
  font-weight: 600;
  font-size: 15px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.persona-summary {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  min-height: 40px;
}

.persona-summary.placeholder {
  color: #c0c4cc;
  font-style: italic;
}

.persona-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.persona-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
