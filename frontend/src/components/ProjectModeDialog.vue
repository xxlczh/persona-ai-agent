<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建项目"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="mode-selection">
      <div
        v-for="mode in modes"
        :key="mode.id"
        class="mode-card"
        :class="{ active: selectedMode === mode.id }"
        @click="selectedMode = mode.id"
      >
        <div class="mode-icon">{{ mode.icon }}</div>
        <div class="mode-title">{{ mode.title }}</div>
        <div class="mode-desc">{{ mode.description }}</div>
        <div class="mode-features">
          <span v-for="feature in mode.features" :key="feature" class="feature-tag">
            {{ feature }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="selectedMode === 'precise'" class="mode-form">
      <el-form :model="preciseForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="preciseForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="行业">
          <el-select v-model="preciseForm.industry" placeholder="请选择行业" style="width: 100%">
            <el-option label="3C数码" value="3c" />
            <el-option label="游戏" value="game" />
            <el-option label="美妆" value="beauty" />
            <el-option label="电商" value="ecommerce" />
            <el-option label="教育" value="education" />
            <el-option label="金融" value="finance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品品类">
          <el-input v-model="preciseForm.productCategory" placeholder="如：智能手机、手游等" />
        </el-form-item>
        <el-form-item label="画像目标">
          <el-input
            v-model="preciseForm.personaGoal"
            type="textarea"
            :rows="2"
            placeholder="描述您想通过画像了解什么"
          />
        </el-form-item>
        <el-form-item label="精度档位">
          <el-radio-group v-model="preciseForm.precision">
            <el-radio label="fast">快速出稿（1分钟）</el-radio>
            <el-radio label="standard">深度专业版（3分钟）</el-radio>
            <el-radio label="custom">极致定制版（5分钟）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="selectedMode === 'simple'" class="mode-form">
      <el-form :model="simpleForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="simpleForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="用户需求">
          <el-input
            v-model="simpleForm.naturalLanguageInput"
            type="textarea"
            :rows="3"
            placeholder="用自然语言描述您想要的画像，如：20-30岁手游玩家画像，用于英雄设计"
          />
        </el-form-item>
        <el-form-item label="">
          <el-checkbox v-model="simpleForm.useIndustryData">
            勾选"行业通用数据增强"
          </el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="selectedMode === 'hybrid'" class="mode-form">
      <el-form :model="hybridForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="hybridForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="补充需求">
          <el-input
            v-model="hybridForm.supplementInput"
            type="textarea"
            :rows="3"
            placeholder="输入任何补充需求，Agent会自动解析"
          />
        </el-form-item>
        <el-form-item label="提示">
          <span class="form-hint">您可以先上传部分数据，然后通过对话迭代完善画像</span>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleCreate" :loading="loading">
        创建项目
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { projectApi } from '@/api';

const dialogVisible = defineModel('visible');
const emit = defineEmits(['created']);

const loading = ref(false);
const selectedMode = ref('precise');

const modes = [
  {
    id: 'precise',
    icon: '🎯',
    title: '精准定制模式',
    description: '通过表单精确配置，适合有明确需求的专业用户',
    features: ['表单配置', '多源数据上传', '可调精度']
  },
  {
    id: 'simple',
    icon: '⚡',
    title: '极简无数据模式',
    description: '自然语言输入，AI自动解析生成，适合懒人或应急场景',
    features: ['自然语言', '无需准备数据', '快速生成']
  },
  {
    id: 'hybrid',
    icon: '🔄',
    title: '混合迭代模式',
    description: '上传部分数据 + 自然语言，生成初稿后可对话迭代',
    features: ['部分数据', '对话迭代', '渐进完善']
  }
];

const preciseForm = ref({
  name: '',
  industry: '',
  productCategory: '',
  personaGoal: '',
  precision: 'standard'
});

const simpleForm = ref({
  name: '',
  naturalLanguageInput: '',
  useIndustryData: true
});

const hybridForm = ref({
  name: '',
  supplementInput: ''
});

const handleCreate = async () => {
  let name = '';
  let description = '';
  let settings = {};

  if (selectedMode.value === 'precise') {
    if (!preciseForm.value.name) {
      ElMessage.warning('请输入项目名称');
      return;
    }
    name = preciseForm.value.name;
    description = `行业: ${preciseForm.value.industry || '未指定'}, 品类: ${preciseForm.value.productCategory || '未指定'}`;
    settings = {
      mode: 'precise',
      industry: preciseForm.value.industry,
      productCategory: preciseForm.value.productCategory,
      personaGoal: preciseForm.value.personaGoal,
      precision: preciseForm.value.precision
    };
  } else if (selectedMode.value === 'simple') {
    if (!simpleForm.value.name) {
      ElMessage.warning('请输入项目名称');
      return;
    }
    name = simpleForm.value.name;
    description = simpleForm.value.naturalLanguageInput;
    settings = {
      mode: 'simple',
      naturalLanguageInput: simpleForm.value.naturalLanguageInput,
      useIndustryData: simpleForm.value.useIndustryData
    };
  } else if (selectedMode.value === 'hybrid') {
    if (!hybridForm.value.name) {
      ElMessage.warning('请输入项目名称');
      return;
    }
    name = hybridForm.value.name;
    description = hybridForm.value.supplementInput;
    settings = {
      mode: 'hybrid',
      supplementInput: hybridForm.value.supplementInput
    };
  }

  loading.value = true;
  try {
    const res = await projectApi.create({ name, description, settings });
    ElMessage.success('项目创建成功');
    dialogVisible.value = false;
    emit('created', res.data);
  } catch (error) {
    console.error('创建项目失败:', error);
    ElMessage.error('创建项目失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.mode-selection {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.mode-card {
  flex: 1;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.mode-card:hover {
  border-color: #409eff;
}

.mode-card.active {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.mode-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.feature-tag {
  font-size: 10px;
  padding: 2px 6px;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
}

.mode-form {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
}
</style>
