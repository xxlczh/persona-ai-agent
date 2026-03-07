import request from './request';

/**
 * 评估相关 API
 */
const evaluationApi = {
  /**
   * 对画像进行质量评估
   * @param {number|string} personaId - 画像 ID
   * @param {Object} data - 评估信息
   * @param {string} [data.evaluated_by] - 评估者
   */
  evaluatePersona(personaId, data) {
    return request({
      url: `/api/evaluation/persona/${personaId}`,
      method: 'post',
      data
    });
  },

  /**
   * 获取画像的评估历史
   * @param {number|string} personaId - 画像 ID
   * @param {Object} params - 查询参数
   * @param {number} [params.limit=10] - 数量限制
   * @param {number} [params.offset=0] - 偏移量
   */
  getHistory(personaId, params) {
    return request({
      url: `/api/evaluation/history/${personaId}`,
      method: 'get',
      params
    });
  },

  /**
   * 获取项目的评估统计
   * @param {number|string} projectId - 项目 ID
   */
  getStatistics(projectId) {
    return request({
      url: `/api/evaluation/statistics/${projectId}`,
      method: 'get'
    });
  }
};

export default evaluationApi;
