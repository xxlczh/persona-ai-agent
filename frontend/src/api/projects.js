import request from './request';

/**
 * 项目相关 API
 */
const projectApi = {
  /**
   * 获取项目列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=10] - 每页数量
   * @param {string} [params.status] - 项目状态
   */
  getList(params) {
    return request({
      url: '/projects',
      method: 'get',
      params
    });
  },

  /**
   * 获取项目详情
   * @param {number|string} id - 项目 ID
   */
  getDetail(id) {
    return request({
      url: `/projects/${id}`,
      method: 'get'
    });
  },

  /**
   * 创建项目
   * @param {Object} data - 项目信息
   * @param {string} data.name - 项目名称
   * @param {string} [data.description] - 项目描述
   * @param {Object} [data.settings] - 项目设置
   * @param {string[]} [data.tags] - 标签
   */
  create(data) {
    return request({
      url: '/projects',
      method: 'post',
      data
    });
  },

  /**
   * 更新项目
   * @param {number|string} id - 项目 ID
   * @param {Object} data - 项目信息
   * @param {string} [data.name] - 项目名称
   * @param {string} [data.description] - 项目描述
   * @param {Object} [data.settings] - 项目设置
   * @param {string[]} [data.tags] - 标签
   * @param {string} [data.status] - 项目状态
   */
  update(id, data) {
    return request({
      url: `/projects/${id}`,
      method: 'put',
      data
    });
  },

  /**
   * 删除项目
   * @param {number|string} id - 项目 ID
   */
  delete(id) {
    return request({
      url: `/projects/${id}`,
      method: 'delete'
    });
  },

  /**
   * 归档项目
   * @param {number|string} id - 项目 ID
   */
  archive(id) {
    return request({
      url: `/projects/${id}/archive`,
      method: 'post'
    });
  }
};

export default projectApi;
