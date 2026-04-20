<template>
  <div class="marketing-script-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📺 营销脚本生成</span>
          <el-button type="primary" size="small" @click="handleGenerate" :loading="loading">
            一键生成
          </el-button>
        </div>
      </template>

      <div v-if="!generatedScript" class="script-config">
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
          <el-form-item label="脚本名称">
            <el-input v-model="config.name" placeholder="如：618大促短视频脚本" />
          </el-form-item>
          <el-form-item label="脚本类型">
            <el-radio-group v-model="config.scriptType">
              <el-radio label="video">短视频脚本（15-30秒）</el-radio>
              <el-radio label="copy">信息流文案</el-radio>
              <el-radio label="social">社交文案</el-radio>
              <el-radio label="strategy">营销策略</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="config.scriptType === 'video'" label="时长">
            <el-slider v-model="config.duration" :min="15" :max="60" show-input />
          </el-form-item>
          <el-form-item label="目标渠道">
            <el-select v-model="config.targetChannel" placeholder="请选择目标渠道" clearable>
              <el-option label="抖音" value="douyin" />
              <el-option label="快手" value="kuaishou" />
              <el-option label="微信朋友圈" value="wechat" />
              <el-option label="微博" value="weibo" />
              <el-option label="小红书" value="xiaohongshu" />
              <el-option label="信息流广告" value="feeds" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="script-result">
        <div class="script-header">
          <h3>{{ generatedScript.name }}</h3>
          <div class="script-actions">
            <el-button size="small" @click="handleExport">导出脚本</el-button>
          </div>
        </div>

        <div class="script-meta">
          <el-tag size="small" type="info">{{ getScriptTypeLabel(generatedScript.type) }}</el-tag>
          <el-tag v-if="generatedScript.duration" size="small">
            {{ generatedScript.duration }}秒
          </el-tag>
        </div>

        <!-- 视频脚本展示 -->
        <div v-if="generatedScript.type === 'video' || generatedScript.content?.scenes" class="video-script">
          <div
            v-for="(scene, index) in (generatedScript.content?.scenes || [])"
            :key="index"
            class="scene-item"
          >
            <div class="scene-header">
              <span class="scene-number">镜头 {{ index + 1 }}</span>
              <span class="scene-time">{{ scene.time_range }}</span>
              <el-tag size="small" type="info">{{ scene.shot_type }}</el-tag>
            </div>
            <div class="scene-content">
              <div v-if="scene.description" class="scene-desc">
                <strong>画面：</strong>{{ scene.description }}
              </div>
              <div v-if="scene.dialogue" class="scene-dialogue">
                <strong>台词：</strong>{{ scene.dialogue }}
              </div>
              <div v-if="scene.bgm_suggestion" class="scene-bgm">
                <strong>BGM：</strong>{{ scene.bgm_suggestion }}
              </div>
            </div>
          </div>
        </div>

        <!-- 文案展示 -->
        <div v-else-if="generatedScript.content" class="copy-content">
          <div v-if="generatedScript.content.ad_headline" class="ad-headline">
            <h4>广告标题</h4>
            <p>{{ generatedScript.content.ad_headline }}</p>
          </div>
          <div v-if="generatedScript.content.ad_body" class="ad-body">
            <h4>正文内容</h4>
            <p>{{ generatedScript.content.ad_body }}</p>
          </div>
          <div v-if="generatedScript.content.cta_text" class="cta-text">
            <h4>行动号召</h4>
            <p>{{ generatedScript.content.cta_text }}</p>
          </div>
        </div>

        <div v-if="generatedScript.content?.hashtags" class="hashtags">
          <span v-for="tag in generatedScript.content.hashtags" :key="tag" class="hashtag">
            #{{ tag }}
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { marketingScriptApi } from '@/api';

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
const generatedScript = ref(null);

const config = reactive({
  personaId: null,
  name: '',
  scriptType: 'video',
  duration: 30,
  targetChannel: ''
});

const getScriptTypeLabel = (type) => {
  const labels = {
    video: '短视频脚本',
    copy: '信息流文案',
    social: '社交文案',
    strategy: '营销策略'
  };
  return labels[type] || type;
};

const handleGenerate = async () => {
  if (!config.name) {
    ElMessage.warning('请输入脚本名称');
    return;
  }

  loading.value = true;
  try {
    const res = await marketingScriptApi.generateMarketingScript({
      projectId: props.projectId,
      personaId: config.personaId,
      persona: config.personaId ? null : props.persona,
      options: {
        scriptType: config.scriptType,
        duration: config.scriptType === 'video' ? config.duration : undefined,
        targetChannel: config.targetChannel
      }
    });

    // 更新名称
    if (config.name) {
      await marketingScriptApi.updateScript(res.data.id, { name: config.name });
      res.data.name = config.name;
    }

    generatedScript.value = res.data;
    ElMessage.success('营销脚本生成成功');
  } catch (error) {
    console.error('生成营销脚本失败:', error);
    ElMessage.error('生成营销脚本失败');
  } finally {
    loading.value = false;
  }
};

const handleExport = () => {
  const dataStr = JSON.stringify(generatedScript.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${generatedScript.value.name}.json`;
  a.click();
  ElMessage.success('导出成功');
};
</script>

<style scoped>
.marketing-script-generator {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.script-config {
  max-width: 600px;
}

.script-result {
  max-width: 800px;
}

.script-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.script-header h3 {
  margin: 0;
}

.script-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.video-script {
  max-height: 500px;
  overflow-y: auto;
}

.scene-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.scene-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.scene-number {
  font-weight: 600;
  color: #409eff;
}

.scene-time {
  font-size: 12px;
  color: #909399;
}

.scene-content {
  padding-left: 16px;
}

.scene-desc,
.scene-dialogue,
.scene-bgm {
  margin-bottom: 4px;
  font-size: 14px;
}

.scene-dialogue {
  color: #67c23a;
  font-style: italic;
}

.scene-bgm {
  color: #909399;
  font-size: 12px;
}

.copy-content {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.ad-headline h4,
.ad-body h4,
.cta-text h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #909399;
}

.ad-headline p,
.ad-body p,
.cta-text p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.hashtag {
  color: #409eff;
  font-size: 14px;
}
</style>
