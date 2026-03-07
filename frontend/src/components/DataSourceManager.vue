<template>
  <div class="data-source-manager">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon>
        上传数据源
      </el-button>
      <el-button @click="loadDataSources">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 数据源列表 -->
    <el-table
      v-loading="loading"
      :data="dataSources"
      style="width: 100%"
      @row-click="handleRowClick"
      highlight-current-row
    >
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
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click.stop="viewDetail(row)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click.stop="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传数据源"
      width="500px"
      @close="resetUploadForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="uploadForm.name" placeholder="可选，默认使用文件名" />
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-exceed="handleExceed"
            :file-list="fileList"
            accept=".csv,.json,.txt,.xlsx,.xml"
            action="#"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="upload-tip">
                支持 CSV、JSON、TXT、XLSX、XML 格式，最大 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="数据源详情"
      width="600px"
    >
      <div v-if="currentSource" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">
            {{ currentSource.name }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(currentSource.type)" size="small">
              {{ currentSource.type.toUpperCase() }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="大小">
            {{ formatFileSize(currentSource.file_size) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentSource.status)" size="small">
              {{ getStatusText(currentSource.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="原始文件名">
            {{ currentSource.original_name }}
          </el-descriptions-item>
          <el-descriptions-item label="MIME类型">
            {{ currentSource.mime_type }}
          </el-descriptions-item>
          <el-descriptions-item label="上传时间" :span="2">
            {{ formatDate(currentSource.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ formatDate(currentSource.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentSource.error_message" label="错误信息" :span="2">
            <el-alert type="error" :closable="false">
              {{ currentSource.error_message }}
            </el-alert>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="danger" @click="handleDelete(currentSource)">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Refresh, Document, View, Delete } from '@element-plus/icons-vue'
import { dataSourceApi } from '@/api'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

// 数据源列表
const loading = ref(false)
const dataSources = ref([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 上传对话框
const showUploadDialog = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({
  name: '',
  file: null
})
const uploadRules = {
  name: [
    { max: 255, message: '名称不能超过255个字符', trigger: 'blur' }
  ]
}
const fileList = ref([])
const uploading = ref(false)

// 详情对话框
const showDetailDialog = ref(false)
const currentSource = ref(null)

// 加载数据源列表
const loadDataSources = async () => {
  loading.value = true
  try {
    const res = await dataSourceApi.getDataSources({
      project_id: props.projectId,
      page: pagination.page,
      limit: pagination.limit
    })
    if (res.success) {
      dataSources.value = res.data.dataSources
      pagination.total = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('加载数据源列表失败')
  } finally {
    loading.value = false
  }
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

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return textMap[status] || status
}

// 获取类型标签类型
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

// 行点击
const handleRowClick = (row) => {
  viewDetail(row)
}

// 查看详情
const viewDetail = async (row) => {
  try {
    const res = await dataSourceApi.getDataSourceById(row.id)
    if (res.success) {
      currentSource.value = res.data.dataSource
      showDetailDialog.value = true
    }
  } catch (error) {
    ElMessage.error('获取数据源详情失败')
  }
}

// 处理文件变化
const handleFileChange = (file) => {
  uploadForm.file = file.raw
}

// 处理文件移除
const handleFileRemove = () => {
  uploadForm.file = null
}

// 处理文件超出限制
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.name = ''
  uploadForm.file = null
  fileList.value = []
}

// 处理上传
const handleUpload = async () => {
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', uploadForm.file)
  formData.append('project_id', props.projectId)
  if (uploadForm.name) {
    formData.append('name', uploadForm.name)
  }

  uploading.value = true
  try {
    const res = await dataSourceApi.uploadDataSource(formData)
    if (res.success) {
      ElMessage.success('上传成功')
      showUploadDialog.value = false
      loadDataSources()
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据源"${row.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await dataSourceApi.deleteDataSource(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      showDetailDialog.value = false
      loadDataSources()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadDataSources()
}

// 每页数量变化
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadDataSources()
}

onMounted(() => {
  loadDataSources()
})

// 暴露刷新方法供父组件调用
defineExpose({
  refresh: loadDataSources
})
</script>

<style scoped>
.data-source-manager {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
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

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.detail-content {
  padding: 10px;
}
</style>
