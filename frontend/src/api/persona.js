import request from './request';

/**
 * 用户画像相关 API
 */
const personaApi = {
  /**
   * 导出用户画像
   * @param {number|string} id - 画像 ID
   * @param {Object} options - 导出选项
   * @param {string} options.format - 导出格式 (json/markdown/pdf)
   * @param {string[]} options.content - 导出内容选项
   */
  export(id, options) {
    return request({
      url: `/persona/${id}/export`,
      method: 'post',
      data: options,
      responseType: 'blob'
    });
  },
  /**
   * 生成用户画像
   * @param {Object} data - 生成信息
   * @param {number|string} data.projectId - 项目 ID
   * @param {number[]|string[]} data.sourceDataIds - 数据源 IDs
   * @param {Object} [data.config] - 生成配置
   */
  generate(data) {
    return request({
      url: '/persona/generate',
      method: 'post',
      data
    });
  },

  /**
   * 获取画像列表
   * @param {Object} params - 查询参数
   * @param {number|string} [params.projectId] - 项目 ID
   * @param {string} [params.status] - 画像状态
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   */
  getList(params) {
    return request({
      url: '/persona/list',
      method: 'get',
      params
    });
  },

  /**
   * 获取画像详情
   * @param {number|string} id - 画像 ID
   */
  getDetail(id) {
    return request({
      url: `/persona/${id}`,
      method: 'get'
    });
  },

  /**
   * 更新画像
   * @param {number|string} id - 画像 ID
   * @param {Object} data - 画像数据
   * @param {string} [data.name] - 名称
   * @param {string} [data.summary] - 摘要
   * @param {Object} [data.demographic] - 人口统计
   * @param {Object} [data.behavioral] - 行为特征
   * @param {Object} [data.psychological] - 心理特征
   * @param {string[]} [data.needs] - 需求
   * @param {string[]} [data.scenario] - 场景
   * @param {string[]} [data.personality_tags] - 人格标签
   * @param {string} [data.communication_style] - 沟通风格
   * @param {Object} [data.marketing_suggestions] - 营销建议
   */
  update(id, data) {
    return request({
      url: `/persona/${id}`,
      method: 'put',
      data
    });
  },

  /**
   * 删除画像
   * @param {number|string} id - 画像 ID
   */
  delete(id) {
    return request({
      url: `/persona/${id}`,
      method: 'delete'
    });
  }
};

export default personaApi;
