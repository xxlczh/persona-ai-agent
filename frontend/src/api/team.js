import request from './request';

const teamApi = {
  create(data) {
    return request.post('/api/teams', data);
  },
  // 兼容组件调用的别名
  createTeam(data) {
    return this.create(data);
  },
  getMyTeams() {
    return request.get('/api/teams/my');
  },
  getDetail(id) {
    return request.get(`/api/teams/${id}`);
  },
  // 兼容组件调用的别名
  getTeamDetail(id) {
    return this.getDetail(id);
  },
  joinByCode(inviteCode) {
    return request.post('/api/teams/join', { inviteCode });
  },
  // 兼容组件调用的别名
  joinTeamByCode(inviteCode) {
    return this.joinByCode(inviteCode);
  },
  update(id, data) {
    return request.put(`/api/teams/${id}`, data);
  },
  delete(id) {
    return request.delete(`/api/teams/${id}`);
  },
  removeMember(teamId, userId) {
    return request.delete(`/api/teams/${teamId}/members/${userId}`);
  },
  // 兼容组件调用的别名
  removeTeamMember(teamId, userId) {
    return this.removeMember(teamId, userId);
  },
  updateMemberRole(teamId, userId, role) {
    return request.put(`/api/teams/${teamId}/members/${userId}/role`, { role });
  },
  leaveTeam(id) {
    return request.post(`/api/teams/${id}/leave`);
  },
  checkProjectAccess(projectId) {
    return request.get(`/api/teams/check-access/${projectId}`);
  },
  assignProjectToTeam(projectId, teamId) {
    return request.post('/api/teams/assign-project', { projectId, teamId });
  }
};

export default teamApi;
