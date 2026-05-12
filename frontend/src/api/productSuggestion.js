import request from './request';

const productSuggestionApi = {
  generate(data) {
    return request.post('/product-suggestions/generate', data);
  },
  // 兼容组件调用的别名
  generateProductSuggestion(data) {
    return this.generate(data);
  },
  getList(projectId, params) {
    return request.get(`/product-suggestions/project/${projectId}`, { params });
  },
  getDetail(id) {
    return request.get(`/product-suggestions/${id}`);
  },
  update(id, data) {
    return request.put(`/product-suggestions/${id}`, data);
  },
  // 兼容组件调用的别名
  updateSuggestion(id, data) {
    return this.update(id, data);
  },
  delete(id) {
    return request.delete(`/product-suggestions/${id}`);
  },
  export(id) {
    return request.get(`/product-suggestions/${id}/export`);
  }
};

export default productSuggestionApi;
