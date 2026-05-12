import request from './request';

const surveyApi = {
  generate(data) {
    return request.post('/api/surveys/generate', data);
  },
  // 兼容组件调用的别名
  generateSurvey(data) {
    return this.generate(data);
  },
  getList(projectId, params) {
    return request.get(`/api/surveys/project/${projectId}`, { params });
  },
  getDetail(id) {
    return request.get(`/api/surveys/${id}`);
  },
  update(id, data) {
    return request.put(`/api/surveys/${id}`, data);
  },
  // 兼容组件调用的别名
  updateSurvey(id, data) {
    return this.update(id, data);
  },
  delete(id) {
    return request.delete(`/api/surveys/${id}`);
  },
  export(id) {
    return request.get(`/api/surveys/${id}/export`);
  }
};

export default surveyApi;
