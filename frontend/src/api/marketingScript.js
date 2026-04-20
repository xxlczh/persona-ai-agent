import request from './request';

const marketingScriptApi = {
  generate(data) {
    return request.post('/marketing-scripts/generate', data);
  },
  getList(projectId, params) {
    return request.get(`/marketing-scripts/project/${projectId}`, { params });
  },
  getDetail(id) {
    return request.get(`/marketing-scripts/${id}`);
  },
  update(id, data) {
    return request.put(`/marketing-scripts/${id}`, data);
  },
  delete(id) {
    return request.delete(`/marketing-scripts/${id}`);
  },
  export(id) {
    return request.get(`/marketing-scripts/${id}/export`);
  }
};

export default marketingScriptApi;
