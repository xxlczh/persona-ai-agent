<template>
  <div class="data-selector">
    <div class="section-header">
      <h3>选择数据源</h3>
      <p class="section-desc">选择要用于生成用户画像的数据源</p>
    </div>

    <!-- 已上传数据源列表 -->
    <el-table
      v-loading="loading"
      :data="dataSources"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="name" label="名称" min-width="180">
        <template #default="{ row }">
          <div class="name-cell">
            <el-icon class="file-icon" :class="row.type">
              <Document />
            </el-icon>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small">
            {{ row.type.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="file_size" label="大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 已选择数据源 -->
    <div v-if="selectedSources.length > 0" class="selected-info">
      <el-alert type="info" :closable="false">
        已选择 <strong>{{ selectedSources.length }}</strong> 个数据源
      </el-alert>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && dataSources.length === 0" description="暂无数据源，请先上传数据" />

    <!-- 刷新按钮 -->
    <div class="refresh-wrapper">
      <el-button @click="loadDataSources" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新列表
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Refresh } from '@element-plus/icons-vue'
import { dataSourceApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['update:selectedSources'])

// 状态
const loading = ref(false)
const dataSources = ref([])
const selectedSources = ref([])

// 加载数据源列表
const loadDataSources = async () => {
  loading.value = true
  try {
    const res = await dataSourceApi.getDataSources({
      project_id: props.projectId,
      page: 1,
      limit: 100
    })
    if (res.success) {
      // 只显示已完成处理的数据源
      dataSources.value = res.data.dataSources.filter(ds => ds.status === 'completed')
    }
  } catch (error) {
    ElMessage.error('加载数据源列表失败')
  } finally {
    loading.value = false
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedSources.value = selection
  emit('update:selectedSources', selection)
}

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 状态相关
const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return textMap[status] || status
}

const getTypeTagType = (type) => {
  const typeMap = {
    csv: 'success',
    json: 'warning',
    txt: 'info',
    xlsx: 'primary',
    xml: 'danger'
  }
  return typeMap[type] || 'info'
}

// 暴露方法
defineExpose({
  loadDataSources,
  getSelectedIds: () => selectedSources.value.map(s => s.id)
})

onMounted(() => {
  loadDataSources()
})
</script>

<style scoped>
.data-selector {
  padding: 10px 0;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.section-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 20px;
}

.file-icon.csv { color: #67c23a; }
.file-icon.json { color: #e6a23c; }
.file-icon.txt { color: #909399; }
.file-icon.xlsx { color: #409eff; }
.file-icon.xml { color: #f56c6c; }

.selected-info {
  margin-top: 16px;
}

.refresh-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
