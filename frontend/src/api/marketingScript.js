import request from './request';

const marketingScriptApi = {
  generate(data) {
    return request.post('/api/marketing-scripts/generate', data, { timeout: 120000 });
  },
  // 兼容组件调用的别名
  generateMarketingScript(data) {
    return this.generate(data);
  },
  getList(projectId, params) {
    return request.get(`/api/marketing-scripts/project/${projectId}`, { params });
  },
  getDetail(id) {
    return request.get(`/api/marketing-scripts/${id}`);
  },
  update(id, data) {
    return request.put(`/api/marketing-scripts/${id}`, data);
  },
  // 兼容组件调用的别名
  updateScript(id, data) {
    return this.update(id, data);
  },
  delete(id) {
    return request.delete(`/api/marketing-scripts/${id}`);
  },
  export(id) {
    return request.get(`/api/marketing-scripts/${id}/export`);
  }
};

export default marketingScriptApi;
