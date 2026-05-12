import request from './request';

const teamApi = {
  create(data) {
    return request.post('/teams', data);
  },
  // 兼容组件调用的别名
  createTeam(data) {
    return this.create(data);
  },
  getMyTeams() {
    return request.get('/teams/my');
  },
  getDetail(id) {
    return request.get(`/teams/${id}`);
  },
  // 兼容组件调用的别名
  getTeamDetail(id) {
    return this.getDetail(id);
  },
  joinByCode(inviteCode) {
    return request.post('/teams/join', { inviteCode });
  },
  // 兼容组件调用的别名
  joinTeamByCode(inviteCode) {
    return this.joinByCode(inviteCode);
  },
  update(id, data) {
    return request.put(`/teams/${id}`, data);
  },
  delete(id) {
    return request.delete(`/teams/${id}`);
  },
  removeMember(teamId, userId) {
    return request.delete(`/teams/${teamId}/members/${userId}`);
  },
  // 兼容组件调用的别名
  removeTeamMember(teamId, userId) {
    return this.removeMember(teamId, userId);
  },
  updateMemberRole(teamId, userId, role) {
    return request.put(`/teams/${teamId}/members/${userId}/role`, { role });
  },
  leaveTeam(id) {
    return request.post(`/teams/${id}/leave`);
  },
  checkProjectAccess(projectId) {
    return request.get(`/teams/check-access/${projectId}`);
  },
  assignProjectToTeam(projectId, teamId) {
    return request.post('/teams/assign-project', { projectId, teamId });
  }
};

export default teamApi;
