import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const request = axios.create({
  baseURL: '',  // 使用代理时为空，实际API通过vite代理转发
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 如果后端返回了 success 字段
    if (data.success !== undefined) {
      if (!data.success) {
        // 显示错误消息
        ElMessage.error(data.message || '请求失败');
        return Promise.reject(new Error(data.message || '请求失败'));
      }
    }

    return response.data;
  },
  (error) => {
    // 处理 HTTP 错误
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          ElMessage.error('登录已过期，请重新登录');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('没有权限执行此操作');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误，请稍后重试');
          break;
        default:
          ElMessage.error(response.data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);

export default request;
