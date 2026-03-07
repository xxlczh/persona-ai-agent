<template>
  <div class="persona-card" @click="handleClick">
    <div class="card-header">
      <div class="persona-avatar">
        <el-avatar :size="48" :style="avatarStyle">
          {{ persona.name ? persona.name.charAt(0).toUpperCase() : 'P' }}
        </el-avatar>
      </div>
      <div class="persona-info">
        <h3 class="persona-name">{{ persona.name || '未命名画像' }}</h3>
        <p class="persona-summary" v-if="persona.summary">
          {{ truncateText(persona.summary, 60) }}
        </p>
      </div>
    </div>

    <div class="card-tags" v-if="persona.personality_tags && persona.personality_tags.length">
      <el-tag
        v-for="(tag, index) in persona.personality_tags.slice(0, 3)"
        :key="index"
        :type="getTagType(index)"
        size="small"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
      <el-tag v-if="persona.personality_tags.length > 3" size="small" type="info">
        +{{ persona.personality_tags.length - 3 }}
      </el-tag>
    </div>

    <div class="card-meta">
      <span class="meta-item">
        <el-icon><Calendar /></el-icon>
        {{ formatDate(persona.created_at) }}
      </span>
      <span class="meta-item" v-if="persona.project">
        <el-icon><Folder /></el-icon>
        {{ persona.project.name }}
      </span>
    </div>

    <div class="card-actions" v-if="showActions" @click.stop>
      <el-button size="small" type="primary" link @click="handleView">
        <el-icon><View /></el-icon>
        查看
      </el-button>
      <el-button size="small" type="primary" link @click="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button size="small" type="danger" link @click="handleDelete">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Folder, View, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  persona: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'view', 'edit', 'delete'])

const avatarColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#C71585', '#FF8C00', '#20B2AA', '#6B8E23', '#4682B4'
]

const avatarStyle = computed(() => {
  const index = props.persona.name ? props.persona.name.charCodeAt(0) % avatarColors.length : 0
  return {
    backgroundColor: avatarColors[index],
    color: '#fff'
  }
})

const getTagType = (index) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
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
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const handleClick = () => {
  emit('click', props.persona)
}

const handleView = () => {
  emit('view', props.persona)
}

const handleEdit = () => {
  emit('edit', props.persona)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此用户画像吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete', props.persona.id)
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.persona-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.persona-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.card-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.persona-info {
  flex: 1;
  min-width: 0;
}

.persona-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.persona-summary {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
</style>
