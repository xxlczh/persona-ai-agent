<template>
  <div class="product-suggestion-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>💡 产品功能建议</span>
          <el-button type="primary" size="small" @click="handleGenerate" :loading="loading">
            一键生成
          </el-button>
        </div>
      </template>

      <div v-if="!generatedReport" class="report-config">
        <el-form :model="config" label-width="120px">
          <el-form-item label="关联画像">
            <el-select v-model="config.personaId" placeholder="请选择画像（可选）" clearable>
              <el-option
                v-for="persona in personas"
                :key="persona.id"
                :label="persona.name"
                :value="persona.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="报告名称">
            <el-input v-model="config.name" placeholder="如：XX产品功能优化建议" />
          </el-form-item>
          <el-form-item label="包含竞品分析">
            <el-switch v-model="config.includeCompetitorAnalysis" />
          </el-form-item>
          <el-form-item label="优先级重点">
            <el-radio-group v-model="config.priorityLevel">
              <el-radio label="high">高优先级功能</el-radio>
              <el-radio label="medium">中等优先级</el-radio>
              <el-radio label="all">全部功能</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="report-result">
        <div class="report-header">
          <h3>{{ generatedReport.name }}</h3>
          <div class="report-actions">
            <el-button size="small" @click="handleExport">导出报告</el-button>
          </div>
        </div>

        <div class="report-meta">
          <el-tag size="small" type="success">
            置信度：{{ (generatedReport.suggestions?.[0]?.confidence_score * 100 || 0).toFixed(0) }}%
          </el-tag>
        </div>

        <div v-if="generatedReport.summary" class="executive-summary">
          <h4>执行摘要</h4>
          <p>{{ generatedReport.summary }}</p>
        </div>

        <div v-if="generatedReport.suggestions" class="suggestions-list">
          <div
            v-for="(suggestion, index) in generatedReport.suggestions"
            :key="index"
            class="suggestion-item"
            :class="suggestion.priority"
          >
            <div class="suggestion-header">
              <span class="priority-badge" :class="suggestion.priority">
                {{ getPriorityLabel(suggestion.priority) }}
              </span>
              <span class="feature-name">{{ suggestion.feature_name }}</span>
              <el-tag size="small" type="info">
                复杂度：{{ suggestion.implementation_complexity }}
              </el-tag>
            </div>
            <div class="suggestion-desc">{{ suggestion.feature_description }}</div>
            <div class="suggestion-details">
              <div v-if="suggestion.user_value">
                <strong>用户价值：</strong>{{ suggestion.user_value }}
              </div>
              <div v-if="suggestion.expected_impact">
                <strong>预期效果：</strong>{{ suggestion.expected_impact }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="generatedReport.competitor_analysis" class="competitor-analysis">
          <h4>竞品分析</h4>
          <p class="comp-summary">{{ generatedReport.competitor_analysis.summary }}</p>
          <div
            v-for="(comp, index) in generatedReport.competitor_analysis.competitors"
            :key="index"
            class="competitor-item"
          >
            <h5>{{ comp.name }}</h5>
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
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { productSuggestionApi } from '@/api';

const props = defineProps({
  projectId: {
    type: Number,
    required: true
  },
  personas: {
    type: Array,
    default: () => []
  },
  persona: {
    type: Object,
    default: null
  }
});

const loading = ref(false);
const generatedReport = ref(null);

const config = reactive({
  personaId: null,
  name: '',
  includeCompetitorAnalysis: true,
  priorityLevel: 'high'
});

const getPriorityLabel = (priority) => {
  const labels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };
  return labels[priority] || priority;
};

const handleGenerate = async () => {
  if (!config.name) {
    ElMessage.warning('请输入报告名称');
    return;
  }

  loading.value = true;
  try {
    const res = await productSuggestionApi.generateProductSuggestion({
      projectId: props.projectId,
      personaId: config.personaId,
      persona: config.personaId ? null : props.persona,
      options: {
        includeCompetitorAnalysis: config.includeCompetitorAnalysis,
        priorityLevel: config.priorityLevel
      }
    });

    // 更新名称
    if (config.name) {
      await productSuggestionApi.updateSuggestion(res.data.id, { name: config.name });
      res.data.name = config.name;
    }

    generatedReport.value = res.data;
    ElMessage.success('产品建议报告生成成功');
  } catch (error) {
    console.error('生成产品建议失败:', error);
    ElMessage.error('生成产品建议失败');
  } finally {
    loading.value = false;
  }
};

const handleExport = () => {
  const dataStr = JSON.stringify(generatedReport.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${generatedReport.value.name}.json`;
  a.click();
  ElMessage.success('导出成功');
};
</script>

<style scoped>
.product-suggestion-generator {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-config {
  max-width: 600px;
}

.report-result {
  max-width: 800px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.report-header h3 {
  margin: 0;
}

.report-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.executive-summary {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.executive-summary h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #409eff;
}

.executive-summary p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.suggestions-list {
  max-height: 500px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
}

.suggestion-item.high {
  border-left: 4px solid #67c23a;
}

.suggestion-item.medium {
  border-left: 4px solid #e6a23c;
}

.suggestion-item.low {
  border-left: 4px solid #909399;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.priority-badge.high {
  background-color: #67c23a;
  color: white;
}

.priority-badge.medium {
  background-color: #e6a23c;
  color: white;
}

.priority-badge.low {
  background-color: #909399;
  color: white;
}

.feature-name {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.suggestion-desc {
  margin-bottom: 8px;
  color: #606266;
}

.suggestion-details {
  font-size: 13px;
  color: #909399;
}

.suggestion-details > div {
  margin-bottom: 4px;
}

.competitor-analysis {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.competitor-analysis h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #409eff;
}

.comp-summary {
  margin-bottom: 16px;
  font-size: 14px;
}

.competitor-item {
  padding: 12px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.competitor-item h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.comp-strengths,
.comp-weaknesses {
  font-size: 13px;
  margin-bottom: 4px;
}
</style>
