<template>
  <div class="team-collaboration">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👥 团队协作</span>
          <el-button v-if="!teams.length" type="primary" size="small" @click="handleCreateTeam">
            创建团队
          </el-button>
        </div>
      </template>

      <!-- 有团队时显示团队列表 -->
      <div v-if="teams.length && !selectedTeam" class="team-list">
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

      <!-- 无团队时显示空状态 -->
      <div v-else-if="!teams.length" class="empty-state">
        <p>暂无团队，点击上方按钮创建一个团队</p>
      </div>

      <!-- 团队详情 -->
      <div v-if="selectedTeam" class="team-detail">
        <div class="detail-header">
          <el-button text @click="selectedTeam = null">← 返回</el-button>
          <h3>{{ selectedTeam.name }}</h3>
          <el-tag>{{ selectedTeam.description || '团队' }}</el-tag>
        </div>

        <div class="invite-section">
          <span>邀请码: </span>
          <el-tag type="success" size="large" class="invite-code">
            {{ selectedTeam.invite_code }}
          </el-tag>
          <el-button size="small" @click="copyInviteCode">复制邀请码</el-button>
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
const showCreateDialog = ref(false);

const teamForm = reactive({
  name: '',
  description: ''
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
    const res = await teamApi.getMyTeams()
    console.log('fetchTeams response:', res.data)

    // 先显示所有团队不过滤
    const allTeams = res.data || []
    console.log('All teams count:', allTeams.length)
    allTeams.forEach(t => {
      console.log('  Team id:', t.id, 'name:', t.name, 'projectId:', t.projectId, 'project_id:', t.project_id)
    })

    // 过滤出当前项目的团队
    if (props.projectId) {
      teams.value = allTeams.filter(t => t.projectId == props.projectId)
      console.log('Filtered teams count:', teams.value.length)
    } else {
      teams.value = allTeams
    }
  } catch (error) {
    console.error('获取团队列表失败:', error)
    ElMessage.error('获取团队列表失败')
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

  console.log('Creating team with projectId:', props.projectId);
  try {
    const res = await teamApi.createTeam({
      name: teamForm.name,
      description: teamForm.description,
      projectId: props.projectId
    });
    console.log('Create response:', res.data);
    console.log('Project ID in response:', res.data?.project_id);
    ElMessage.success('团队创建成功');
    showCreateDialog.value = false;
    // 延迟一下再获取列表，确保数据库已更新
    setTimeout(() => fetchTeams(), 500);
  } catch (error) {
    console.error('创建团队失败:', error);
    ElMessage.error(error.response?.data?.message || '创建团队失败');
  }
};

// 复制邀请码
const copyInviteCode = () => {
  navigator.clipboard.writeText(selectedTeam.value.invite_code);
  ElMessage.success('邀请码已复制');
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

onMounted(() => {
  fetchTeams();
});
</script>

<style scoped>
.team-collaboration {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.team-card {
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

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
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

.members-section h4 {
  margin: 0 0 12px 0;
}
</style>