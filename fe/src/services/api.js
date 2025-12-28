import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    config.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code !== 200) {
      message.error(response.data.message || '请求失败');
      return Promise.reject(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token 过期，清除本地存储
          localStorage.clear();
          // 清除 axios 默认 headers 中的 token
          delete api.defaults.headers.common['Authorization'];
          message.error('登录已过期，请重新登录');
          // 使用 replace 而不是 href，避免浏览器历史记录问题
          window.location.replace('/login');
          break;
        case 403:
          message.error('无权限进行此操作');
          break;
        default:
          message.error(error.response.data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data.data;
    
    if (!token || !user) {
      throw new Error('登录返回数据不完整');
    }
    
    // 保存 token 和用户信息
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 更新 axios 默认 headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return response.data.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data.data;
};

// Workspace API
export const getWorkspaces = async () => {
  const response = await api.get('/workspaces/list');
  return response.data.data;
};

export const createWorkspace = async (data) => {
  const response = await api.post('/workspaces/create', data);
  return response.data.data;
};

export const updateWorkspace = async (id, data) => {
  const response = await api.post(`/workspaces/${id}/update`, data);
  return response.data.data;
};

export const deleteWorkspace = async (id) => {
  const response = await api.post(`/workspaces/${id}/delete`);
  return response.data.data;
};

export const getWorkspaceMembers = async (workspaceId) => {
  const response = await api.get(`/workspaces/members/${workspaceId}`);
  return response.data.data;
};

export const updateWorkspaceMembers = async (workspaceId, userIds) => {
  const response = await api.post(`/workspaces/members/${workspaceId}/update`, userIds);
  return response.data.data;
};

// Project API
export const getProjects = async (workspaceId) => {
  const url = workspaceId ? `/projects/list?workspaceId=${workspaceId}` : '/projects/list';
  const response = await api.get(url);
  return response.data.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects/create', data);
  return response.data.data;
};

export const updateProject = async (id, data) => {
  const response = await api.post(`/projects/${id}/update`, data);
  return response.data.data;
};

export const deleteProject = async (id) => {
  const response = await api.post(`/projects/${id}/delete`);
  return response.data.data;
};

// Prompt API
export const getPrompts = async (projectId, workspaceId) => {
  let url = '/prompts/list';
  const params = new URLSearchParams();
  
  if (projectId) {
    params.append('projectId', projectId);
  }
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  // 如果有参数则添加到url
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await api.get(url);
  return response.data.data || [];
};

export const getPromptById = async (id) => {
  const response = await api.get(`/prompts/detail/${id}`);
  return response.data.data;
};

export const createPrompt = async (data) => {
  const response = await api.post('/prompts/create', data);
  return response.data.data;
};

export const updatePrompt = async (id, data) => {
  const { message, updateUserId, ...promptData } = data;
  const response = await api.post(`/prompts/${id}/update`, {
    prompt: {
      ...promptData,
      updateUserId  // 确保 updateUserId 被包含在 prompt 对象中
    },
    message: message || '更新提示词'
  });
  return response.data.data;
};

export const deletePrompt = async (id) => {
  const response = await api.post(`/prompts/${id}/delete`);
  return response.data.data;
};

// 获取提示词历史版本列表(不包含内容)
export const getPromptHistory = async (promptId) => {
  const response = await api.get(`/prompts/${promptId}/history/list`);
  return response.data.data;
};

// 获取指定版本的提示词详情
export const getPromptHistoryVersion = async (promptId, version) => {
  const response = await api.get(`/prompts/${promptId}/history/${version}`);
  return response.data.data;
};

// Model API
export const getModels = async () => {
  const response = await api.get('/models/list');
  return response.data.data;
};

export const createModel = async (data) => {
  const response = await api.post('/models/create', data);
  return response.data.data;
};

export const updateModel = async (id, data) => {
  const response = await api.post(`/models/${id}/update`, data);
  return response.data.data;
};

export const deleteModel = async (id) => {
  const response = await api.post(`/models/${id}/delete`);
  return response.data.data;
};

export const callModel = async (id, data) => {
  const response = await api.post(`/models/${id}/call`, data);
  return response.data.data;
};

// User API
export const getUsers = async () => {
  const response = await api.get('/users/list');
  return response.data.data;
};

// 批量添加工作空间成员
export const addWorkspaceMembers = async (workspaceId, memberIds) => {
  const response = await api.post(`/workspaces/members/${workspaceId}/add`, memberIds);
  return response.data.data;
};

// 批量移除工作空间成员
export const removeWorkspaceMembers = async (workspaceId, memberIds) => {
  const response = await api.post(`/workspaces/members/${workspaceId}/remove`, memberIds);
  return response.data.data;
};

// 添加更新提示词基本信息的 API
export const updatePromptBasicInfo = async (id, data) => {
  const response = await api.post(`/prompts/${id}/update-basic-info`, data);
  return response.data.data;
};

// 添加登出函数
export const logout = () => {
  localStorage.clear();
  delete api.defaults.headers.common['Authorization'];
  window.location.replace('/login');
};

export default api; 