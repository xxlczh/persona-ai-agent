<template>
  <div class="team-collaboration">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👥 团队协作</span>
          <el-button type="primary" size="small" @click="handleCreateTeam">
            创建团队
          </el-button>
        </div>
      </template>

      <!-- 团队列表 -->
      <div v-if="!selectedTeam" class="team-list">
        <el-empty v-if="teams.length === 0" description="暂无团队">
          <el-button type="primary" @click="handleCreateTeam">创建第一个团队</el-button>
        </el-empty>
        <div v-else class="team-cards">
          <el-card
            v-for="team in teams"
            :key="team.id"
            class="team-card"
            @click="selectTeam(team)"
          >
            <template #header>
              <div class="team-header">
                <span>{{ team.name }}</span>
                <el-tag v-if="isTeamOwner(team)" size="small" type="success">所有者</el-tag>
              </div>
            </template>
            <p>{{ team.description || '暂无描述' }}</p>
            <div class="team-info">
              <span>成员数: {{ team.members?.length || 0 }}</span>
              <span>邀请码: {{ team.invite_code }}</span>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 团队详情 -->
      <div v-else class="team-detail">
        <div class="detail-header">
          <el-button text @click="selectedTeam = null">← 返回团队列表</el-button>
          <h3>{{ selectedTeam.name }}</h3>
          <el-tag>{{ selectedTeam.description || '团队' }}</el-tag>
        </div>

        <div class="invite-section">
          <span>邀请码: </span>
          <el-tag type="success" size="large" class="invite-code">
            {{ selectedTeam.invite_code }}
          </el-tag>
          <el-button size="small" @click="copyInviteCode">复制邀请码</el-button>
          <el-button size="small" @click="showJoinDialog = true">通过邀请码加入</el-button>
        </div>

        <div class="members-section">
          <h4>成员列表</h4>
          <el-table :data="selectedTeam.members" border>
            <el-table-column prop="user.username" label="用户名" />
            <el-table-column prop="user.email" label="邮箱" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'success' : 'info'">
                  {{ row.role === 'admin' ? '管理员' : '成员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <div v-if="isTeamOwner(selectedTeam) && row.role !== 'admin'">
                  <el-button size="small" type="danger" @click="handleRemoveMember(row)">
                    移除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="projects-section">
          <h4>团队项目</h4>
          <p class="hint">将项目分配给团队后，团队成员可以查看</p>
          <el-select v-model="selectedProjectId" placeholder="选择项目分配给团队" clearable>
            <el-option
              v-for="project in userProjects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
          <el-button type="primary" size="small" @click="handleAssignProject" :disabled="!selectedProjectId">
            分配项目
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 创建团队对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建团队" width="400px">
      <el-form :model="teamForm" label-width="80px">
        <el-form-item label="团队名称">
          <el-input v-model="teamForm.name" placeholder="请输入团队名称" />
        </el-form-item>
        <el-form-item label="团队描述">
          <el-input v-model="teamForm.description" type="textarea" :rows="3" placeholder="请输入团队描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTeam">创建</el-button>
      </template>
    </el-dialog>

    <!-- 通过邀请码加入对话框 -->
    <el-dialog v-model="showJoinDialog" title="加入团队" width="400px">
      <el-form :model="joinForm" label-width="80px">
        <el-form-item label="邀请码">
          <el-input v-model="joinForm.inviteCode" placeholder="请输入邀请码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmJoinTeam">加入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { teamApi } from '@/api';

const props = defineProps({
  projectId: {
    type: Number,
    default: null
  }
});

const teams = ref([]);
const selectedTeam = ref(null);
const userProjects = ref([]);
const selectedProjectId = ref(null);

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);

const teamForm = reactive({
  name: '',
  description: ''
});

const joinForm = reactive({
  inviteCode: ''
});

const isTeamOwner = (team) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  const user = JSON.parse(userStr);
  return team.owner_id === user.id;
};

// 获取团队列表
const fetchTeams = async () => {
  try {
    const res = await teamApi.getMyTeams();
    teams.value = res.data || [];
  } catch (error) {
    console.error('获取团队列表失败:', error);
  }
};

// 选择团队
const selectTeam = async (team) => {
  try {
    const res = await teamApi.getTeamDetail(team.id);
    selectedTeam.value = res.data;
  } catch (error) {
    console.error('获取团队详情失败:', error);
    ElMessage.error('获取团队详情失败');
  }
};

// 创建团队
const handleCreateTeam = () => {
  teamForm.name = '';
  teamForm.description = '';
  showCreateDialog.value = true;
};

const confirmCreateTeam = async () => {
  if (!teamForm.name) {
    ElMessage.warning('请输入团队名称');
    return;
  }

  try {
    await teamApi.createTeam({
      name: teamForm.name,
      description: teamForm.description
    });
    ElMessage.success('团队创建成功');
    showCreateDialog.value = false;
    fetchTeams();
  } catch (error) {
    console.error('创建团队失败:', error);
    ElMessage.error('创建团队失败');
  }
};

// 复制邀请码
const copyInviteCode = () => {
  navigator.clipboard.writeText(selectedTeam.value.invite_code);
  ElMessage.success('邀请码已复制');
};

// 确认加入团队
const confirmJoinTeam = async () => {
  if (!joinForm.inviteCode) {
    ElMessage.warning('请输入邀请码');
    return;
  }

  try {
    await teamApi.joinTeamByCode(joinForm.inviteCode);
    ElMessage.success('加入团队成功');
    showJoinDialog.value = false;
    fetchTeams();
  } catch (error) {
    console.error('加入团队失败:', error);
    ElMessage.error(error.message || '加入团队失败');
  }
};

// 移除成员
const handleRemoveMember = async (member) => {
  try {
    await teamApi.removeTeamMember(selectedTeam.value.id, member.user_id);
    ElMessage.success('成员已移除');
    selectTeam(selectedTeam.value);
  } catch (error) {
    console.error('移除成员失败:', error);
    ElMessage.error('移除成员失败');
  }
};

// 分配项目
const handleAssignProject = async () => {
  if (!selectedProjectId.value) return;

  try {
    await teamApi.assignProjectToTeam(selectedProjectId.value, selectedTeam.value.id);
    ElMessage.success('项目已分配给团队');
  } catch (error) {
    console.error('分配项目失败:', error);
    ElMessage.error('分配项目失败');
  }
};

onMounted(() => {
  fetchTeams();
});
</script>

<style scoped>
.team-collaboration {
  max-width: 800px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-list {
  min-height: 200px;
}

.team-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.team-card {
  width: 280px;
  cursor: pointer;
  transition: all 0.3s;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.team-detail {
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0;
}

.invite-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.invite-code {
  font-size: 16px;
  letter-spacing: 2px;
}

.members-section,
.projects-section {
  margin-bottom: 20px;
}

.members-section h4,
.projects-section h4 {
  margin: 0 0 12px 0;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
</style>
