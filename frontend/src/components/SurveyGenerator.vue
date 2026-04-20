<template>
  <div class="survey-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📋 用研问卷生成</span>
          <el-button type="primary" size="small" @click="handleGenerate" :loading="loading">
            一键生成问卷
          </el-button>
        </div>
      </template>

      <div v-if="!generatedSurvey" class="survey-config">
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
          <el-form-item label="问卷名称">
            <el-input v-model="config.name" placeholder="如：年轻妈妈用户需求调研" />
          </el-form-item>
          <el-form-item label="问题数量">
            <el-slider v-model="config.questionCount" :min="10" :max="30" show-input />
          </el-form-item>
          <el-form-item label="包含逻辑跳转">
            <el-switch v-model="config.includeLogicJump" />
          </el-form-item>
          <el-form-item label="目标受众">
            <el-input v-model="config.targetAudience" placeholder="描述目标受众特征" />
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="survey-result">
        <div class="survey-header">
          <h3>{{ generatedSurvey.name }}</h3>
          <div class="survey-actions">
            <el-button size="small" @click="handleExport('json')">导出JSON</el-button>
            <el-button size="small" type="primary" @click="handleExport('markdown')">导出Markdown</el-button>
          </div>
        </div>

        <div class="survey-meta">
          <el-tag size="small">约{{ generatedSurvey.settings?.estimatedTime || 10 }}分钟</el-tag>
          <el-tag size="small" type="info">{{ generatedSurvey.questions?.length || 0 }}题</el-tag>
        </div>

        <div class="survey-intro">
          <p><strong>引言：</strong>{{ generatedSurvey.description || '感谢您参与本次调研...' }}</p>
        </div>

        <div class="survey-questions">
          <div
            v-for="(q, index) in generatedSurvey.questions"
            :key="index"
            class="question-item"
          >
            <div class="question-header">
              <span class="question-number">{{ index + 1 }}.</span>
              <span class="question-type">{{ getQuestionTypeLabel(q.type) }}</span>
              <el-tag v-if="q.required" size="small" type="danger">必答</el-tag>
            </div>
            <div class="question-text">{{ q.question_text }}</div>
            <div v-if="q.options" class="question-options">
              <div v-for="(opt, optIndex) in q.options" :key="optIndex" class="option-item">
                {{ opt }}
              </div>
            </div>
            <div v-if="q.scale_points" class="question-scale">
              <el-slider
                :min="1"
                :max="q.scale_points"
                :show-input="true"
                disabled
                style="width: 200px"
              />
              <span class="scale-labels">{{ q.scale_labels?.low }} — {{ q.scale_labels?.high }}</span>
            </div>
          </div>
        </div>

        <div class="survey-ending">
          <p><strong>结束语：</strong>{{ generatedSurvey.questions?.slice(-1)[0]?.category || '感谢您的参与' }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { surveyApi } from '@/api';

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
const generatedSurvey = ref(null);

const config = reactive({
  personaId: null,
  name: '',
  questionCount: 15,
  includeLogicJump: true,
  targetAudience: ''
});

const getQuestionTypeLabel = (type) => {
  const labels = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    scale: '量表题',
    open_ended: '开放题'
  };
  return labels[type] || type;
};

const handleGenerate = async () => {
  if (!config.name) {
    ElMessage.warning('请输入问卷名称');
    return;
  }

  loading.value = true;
  try {
    const res = await surveyApi.generateSurvey({
      projectId: props.projectId,
      personaId: config.personaId,
      persona: config.personaId ? null : props.persona,
      options: {
        questionCount: config.questionCount,
        includeLogicJump: config.includeLogicJump,
        targetAudience: config.targetAudience
      }
    });

    // 更新问卷名称
    if (config.name) {
      await surveyApi.updateSurvey(res.data.id, { name: config.name });
      res.data.name = config.name;
    }

    generatedSurvey.value = res.data;
    ElMessage.success('问卷生成成功');
  } catch (error) {
    console.error('生成问卷失败:', error);
    ElMessage.error('生成问卷失败');
  } finally {
    loading.value = false;
  }
};

const handleExport = (format) => {
  if (format === 'json') {
    const dataStr = JSON.stringify(generatedSurvey.value, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedSurvey.value.name}.json`;
    a.click();
  } else {
    // Markdown export
    let md = `# ${generatedSurvey.value.name}\n\n`;
    md += `## 引言\n${generatedSurvey.value.description || '感谢您参与本次调研'}\n\n`;
    md += `## 问题\n\n`;

    generatedSurvey.value.questions?.forEach((q, i) => {
      md += `${i + 1}. [${getQuestionTypeLabel(q.type)}] ${q.question_text}\n`;
      if (q.options) {
        q.options.forEach((opt, j) => {
          md += `   ${String.fromCharCode(65 + j)}. ${opt}\n`;
        });
      }
      md += '\n';
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedSurvey.value.name}.md`;
    a.click();
  }
  ElMessage.success('导出成功');
};
</script>

<style scoped>
.survey-generator {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.survey-config {
  max-width: 600px;
}

.survey-result {
  max-width: 800px;
}

.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.survey-header h3 {
  margin: 0;
}

.survey-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.survey-intro {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.survey-questions {
  max-height: 500px;
  overflow-y: auto;
}

.question-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-number {
  font-weight: 600;
  color: #409eff;
}

.question-type {
  font-size: 12px;
  color: #909399;
}

.question-text {
  font-size: 14px;
  margin-bottom: 8px;
}

.question-options {
  padding-left: 20px;
}

.option-item {
  padding: 4px 0;
  color: #606266;
}

.question-scale {
  padding-left: 20px;
}

.scale-labels {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.survey-ending {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-top: 16px;
}
</style>
