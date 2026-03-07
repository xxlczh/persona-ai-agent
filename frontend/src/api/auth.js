import request from './request';

/**
 * 认证相关 API
 */
const authApi = {
  /**
   * 用户注册
   * @param {Object} data - 注册信息
   * @param {string} data.username - 用户名
   * @param {string} data.email - 邮箱
   * @param {string} data.password - 密码
   * @param {string} [data.nickname] - 昵称
   */
  register(data) {
    return request({
      url: '/api/users/register',
      method: 'post',
      data
    });
  },

  /**
   * 用户登录
   * @param {Object} data - 登录信息
   * @param {string} data.username - 用户名或邮箱
   * @param {string} data.password - 密码
   */
  login(data) {
    return request({
      url: '/api/users/login',
      method: 'post',
      data
    });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return request({
      url: '/api/users/me',
      method: 'get'
    });
  },

  /**
   * 更新当前用户信息
   * @param {Object} data - 用户信息
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar] - 头像
   */
  updateProfile(data) {
    return request({
      url: '/api/users/me',
      method: 'put',
      data
    });
  },

  /**
   * 修改密码
   * @param {Object} data - 密码信息
   * @param {string} data.oldPassword - 旧密码
   * @param {string} data.newPassword - 新密码
   */
  changePassword(data) {
    return request({
      url: '/api/users/me/password',
      method: 'put',
      data
    });
  }
};

export default authApi;
