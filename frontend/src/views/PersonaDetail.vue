<template>
  <div class="persona-detail-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
          <h2>画像详情</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showExportDialog = true">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button @click="showEditDialog = true">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-wrapper">
          <el-skeleton :rows="10" animated />
        </div>

        <!-- 错误状态 -->
        <el-result
          v-else-if="error"
          icon="error"
          title="加载失败"
          :sub-title="error"
        >
          <template #extra>
            <el-button type="primary" @click="loadPersona">重试</el-button>
          </template>
        </el-result>

        <!-- 画像内容 -->
        <div v-else-if="persona" class="persona-content">
          <!-- 基本信息卡片 -->
          <el-card class="info-card" shadow="hover">
            <div class="persona-header">
              <div class="persona-avatar">
                <el-avatar :size="64" :style="avatarStyle">
                  {{ persona.name ? persona.name.charAt(0).toUpperCase() : 'P' }}
                </el-avatar>
              </div>
              <div class="persona-info">
                <h2>{{ persona.name }}</h2>
                <div class="persona-meta">
                  <el-tag type="success" effect="dark">生成成功</el-tag>
                  <span>创建时间：{{ formatDate(persona.created_at) }}</span>
                  <span v-if="persona.project">所属项目：{{ persona.project.name }}</span>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 画像详情 -->
          <el-tabs v-model="activeTab" class="detail-tabs">
            <!-- 摘要 -->
            <el-tab-pane label="摘要" name="summary">
              <el-card shadow="hover">
                <div class="summary-text">{{ persona.summary || '暂无摘要' }}</div>
              </el-card>
            </el-tab-pane>

            <!-- 人口统计特征 -->
            <el-tab-pane label="人口统计" name="demographic" v-if="persona.demographic">
              <el-card shadow="hover">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="年龄" v-if="persona.demographic.age">
                    {{ persona.demographic.age }}
                  </el-descriptions-item>
                  <el-descriptions-item label="性别" v-if="persona.demographic.gender">
                    {{ persona.demographic.gender }}
                  </el-descriptions-item>
                  <el-descriptions-item label="职业" v-if="persona.demographic.occupation">
                    {{ persona.demographic.occupation }}
                  </el-descriptions-item>
                  <el-descriptions-item label="收入" v-if="persona.demographic.income">
                    {{ persona.demographic.income }}
                  </el-descriptions-item>
                  <el-descriptions-item label="学历" v-if="persona.demographic.education">
                    {{ persona.demographic.education }}
                  </el-descriptions-item>
                  <el-descriptions-item label="地区" v-if="persona.demographic.location">
                    {{ persona.demographic.location }}
                  </el-descriptions-item>
                </el-descriptions>
                <div v-if="persona.demographic.description" class="dimension-desc">
                  <h4>详细描述</h4>
                  <p>{{ persona.demographic.description }}</p>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 行为特征 -->
            <el-tab-pane label="行为特征" name="behavioral" v-if="persona.behavioral">
              <el-card shadow="hover">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="使用频率" v-if="persona.behavioral.usage_frequency">
                    {{ persona.behavioral.usage_frequency }}
                  </el-descriptions-item>
                  <el-descriptions-item label="使用时段" v-if="persona.behavioral.usage_time">
                    {{ persona.behavioral.usage_time }}
                  </el-descriptions-item>
                  <el-descriptions-item label="使用场景" v-if="persona.behavioral.usage_scenario">
                    {{ persona.behavioral.usage_scenario }}
                  </el-descriptions-item>
                  <el-descriptions-item label="核心行为" v-if="persona.behavioral.core_behavior">
                    {{ persona.behavioral.core_behavior }}
                  </el-descriptions-item>
                  <el-descriptions-item label="消费习惯" v-if="persona.behavioral.consumption_habit">
                    {{ persona.behavioral.consumption_habit }}
                  </el-descriptions-item>
                </el-descriptions>
                <div v-if="persona.behavioral.description" class="dimension-desc">
                  <h4>详细描述</h4>
                  <p>{{ persona.behavioral.description }}</p>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 心理特征 -->
            <el-tab-pane label="心理特征" name="psychological" v-if="persona.psychological">
              <el-card shadow="hover">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="价值观" v-if="persona.psychological.values">
                    {{ persona.psychological.values }}
                  </el-descriptions-item>
                  <el-descriptions-item label="态度" v-if="persona.psychological.attitude">
                    {{ persona.psychological.attitude }}
                  </el-descriptions-item>
                  <el-descriptions-item label="动机" v-if="persona.psychological.motivation">
                    {{ persona.psychological.motivation }}
                  </el-descriptions-item>
                  <el-descriptions-item label="痛点" v-if="persona.psychological.pain_points">
                    {{ persona.psychological.pain_points }}
                  </el-descriptions-item>
                  <el-descriptions-item label="兴趣" v-if="persona.psychological.interests">
                    {{ persona.psychological.interests }}
                  </el-descriptions-item>
                </el-descriptions>
                <div v-if="persona.psychological.description" class="dimension-desc">
                  <h4>详细描述</h4>
                  <p>{{ persona.psychological.description }}</p>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 需求分析 -->
            <el-tab-pane label="需求分析" name="needs" v-if="persona.needs && persona.needs.length">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>用户需求</span>
                  </div>
                </template>
                <div class="needs-list">
                  <el-tag
                    v-for="(need, index) in persona.needs"
                    :key="index"
                    type="primary"
                    effect="plain"
                    class="need-item"
                  >
                    {{ need }}
                  </el-tag>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 使用场景 -->
            <el-tab-pane label="使用场景" name="scenario" v-if="persona.scenario && persona.scenario.length">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>典型场景</span>
                  </div>
                </template>
                <div class="scenario-list">
                  <div
                    v-for="(scene, index) in persona.scenario"
                    :key="index"
                    class="scenario-item"
                  >
                    <div class="scenario-index">{{ index + 1 }}</div>
                    <div class="scenario-content">{{ scene }}</div>
                  </div>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 人格标签 -->
            <el-tab-pane label="人格标签" name="personality" v-if="persona.personality_tags && persona.personality_tags.length">
              <el-card shadow="hover">
                <div class="tags-container">
                  <el-tag
                    v-for="(tag, index) in persona.personality_tags"
                    :key="index"
                    :type="getTagType(index)"
                    effect="dark"
                    size="large"
                    class="personality-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 营销建议 -->
            <el-tab-pane label="营销建议" name="marketing" v-if="persona.marketing_suggestions">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>营销策略建议</span>
                  </div>
                </template>
                <div class="marketing-content">
                  <div v-if="persona.marketing_suggestions.channel">
                    <h4>推荐渠道</h4>
                    <p>{{ persona.marketing_suggestions.channel }}</p>
                  </div>
                  <div v-if="persona.marketing_suggestions.content_type">
                    <h4>内容形式</h4>
                    <p>{{ persona.marketing_suggestions.content_type }}</p>
                  </div>
                  <div v-if="persona.marketing_suggestions.key_message">
                    <h4>核心信息</h4>
                    <p>{{ persona.marketing_suggestions.key_message }}</p>
                  </div>
                  <div v-if="persona.marketing_suggestions.promotion_strategy">
                    <h4>推广策略</h4>
                    <p>{{ persona.marketing_suggestions.promotion_strategy }}</p>
                  </div>
                  <div v-if="persona.marketing_suggestions.description">
                    <h4>详细建议</h4>
                    <p>{{ persona.marketing_suggestions.description }}</p>
                  </div>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 原始数据 -->
            <el-tab-pane label="原始数据" name="raw">
              <el-card shadow="hover">
                <el-button @click="toggleRawView" size="small">
                  {{ showRaw ? '收起' : '查看' }} 原始 JSON
                </el-button>
                <div v-if="showRaw" class="raw-content">
                  <pre>{{ rawJson }}</pre>
                </div>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 空状态 -->
        <el-result v-else icon="info" title="未找到画像" sub-title="该画像可能已被删除">
          <template #extra>
            <el-button type="primary" @click="goBack">返回项目</el-button>
          </template>
        </el-result>
      </el-main>
    </el-container>

    <!-- 编辑对话框 -->
    <PersonaEditor
      v-model="showEditDialog"
      :persona="persona"
      @save="handleSave"
    />

    <!-- 导出对话框 -->
    <PersonaExport
      v-model="showExportDialog"
      :persona="persona"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Download, Edit, Delete } from '@element-plus/icons-vue'
import { personaApi } from '@/api'
import PersonaEditor from '@/components/PersonaEditor.vue'
import PersonaExport from '@/components/PersonaExport.vue'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(true)
const error = ref('')
const persona = ref(null)
const activeTab = ref('summary')
const showRaw = ref(false)
const showEditDialog = ref(false)
const showExportDialog = ref(false)

// 画像 ID
const personaId = computed(() => {
  return parseInt(route.params.id) || null
})

// 头像样式
const avatarColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#C71585', '#FF8C00', '#20B2AA', '#6B8E23', '#4682B4'
]

const avatarStyle = computed(() => {
  const index = persona.value?.name ? persona.value.name.charCodeAt(0) % avatarColors.length : 0
  return {
    backgroundColor: avatarColors[index],
    color: '#fff',
    fontSize: '24px'
  }
})

// 原始 JSON
const rawJson = computed(() => {
  return persona.value ? JSON.stringify(persona.value, null, 2) : ''
})

// 获取标签类型
const getTagType = (index) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 加载画像
const loadPersona = async () => {
  if (!personaId.value) {
    error.value = '无效的画像 ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await personaApi.getDetail(personaId.value)
    if (res.success) {
      persona.value = res.data
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  if (persona.value?.project) {
    router.push(`/project/${persona.value.project.id}`)
  } else {
    router.push('/projects')
  }
}

// 切换原始数据视图
const toggleRawView = () => {
  showRaw.value = !showRaw.value
}

// 保存编辑
const handleSave = async (data) => {
  try {
    const res = await personaApi.update(personaId.value, data)
    if (res.success) {
      ElMessage.success('保存成功')
      persona.value = res.data
      showEditDialog.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

// 删除
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

    const res = await personaApi.delete(personaId.value)
    if (res.success) {
      ElMessage.success('删除成功')
      goBack()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (err) {
    // 用户取消
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadPersona()
})
</script>

<style scoped>
.persona-detail-container {
  height: 100vh;
}

.el-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 100%;
}

.header-content h2 {
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-wrapper {
  padding: 40px;
}

.persona-content {
  padding: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.persona-header {
  display: flex;
  gap: 20px;
  align-items: center;
}

.persona-info h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
}

.persona-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.detail-tabs {
  margin-top: 20px;
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  padding: 10px;
}

.dimension-desc {
  margin-top: 20px;
}

.dimension-desc h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
}

.dimension-desc p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.card-header {
  font-weight: 600;
}

.needs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.need-item {
  font-size: 14px;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scenario-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.scenario-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.scenario-content {
  flex: 1;
  line-height: 1.6;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.personality-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.marketing-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.marketing-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.marketing-content p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.raw-content {
  margin-top: 16px;
}

.raw-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
}
</style>
