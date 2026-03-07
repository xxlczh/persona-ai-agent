/**
 * 数据源 API
 */
import request from './request';

/**
 * 获取数据源列表
 * @param {Object} params - 查询参数
 * @param {number} params.project_id - 项目ID
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 状态筛选
 */
export const getDataSources = (params) => {
  return request({
    url: '/datasources',
    method: 'get',
    params
  });
};

/**
 * 获取数据源详情
 * @param {number} id - 数据源ID
 */
export const getDataSourceById = (id) => {
  return request({
    url: `/datasources/${id}`,
    method: 'get'
  });
};

/**
 * 上传数据源文件
 * @param {FormData} formData - 表单数据
 */
export const uploadDataSource = (formData) => {
  return request({
    url: '/datasources',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 更新数据源信息
 * @param {number} id - 数据源ID
 * @param {Object} data - 更新数据
 */
export const updateDataSource = (id, data) => {
  return request({
    url: `/datasources/${id}`,
    method: 'put',
    data
  });
};

/**
 * 删除数据源
 * @param {number} id - 数据源ID
 */
export const deleteDataSource = (id) => {
  return request({
    url: `/datasources/${id}`,
    method: 'delete'
  });
};

export default {
  getDataSources,
  getDataSourceById,
  uploadDataSource,
  updateDataSource,
  deleteDataSource
};
