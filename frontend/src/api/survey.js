import request from './request';

const surveyApi = {
  generate(data) {
    return request.post('/surveys/generate', data);
  },
  getList(projectId, params) {
    return request.get(`/surveys/project/${projectId}`, { params });
  },
  getDetail(id) {
    return request.get(`/surveys/${id}`);
  },
  update(id, data) {
    return request.put(`/surveys/${id}`, data);
  },
  delete(id) {
    return request.delete(`/surveys/${id}`);
  },
  export(id) {
    return request.get(`/surveys/${id}/export`);
  }
};

export default surveyApi;
