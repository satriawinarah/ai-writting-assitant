import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Projects
export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Chapters
export const chaptersAPI = {
  create: (projectId, data) => api.post(`/projects/${projectId}/chapters`, data),
  get: (projectId, chapterId) => api.get(`/projects/${projectId}/chapters/${chapterId}`),
  update: (projectId, chapterId, data) => api.put(`/projects/${projectId}/chapters/${chapterId}`, data),
  delete: (projectId, chapterId) => api.delete(`/projects/${projectId}/chapters/${chapterId}`),
};

// AI
export const aiAPI = {
  continue: (context, options = {}) => api.post('/ai/continue', {
    context,
    max_tokens: options.maxTokens || 10000,
    temperature: options.temperature || 0.7,
    writing_style: options.writingStyle || 'puitis',
    paragraph_count: options.paragraphCount || 1,
    brief_idea: options.briefIdea || '',
    model: options.model || 'openai/gpt-oss-120b',
  }),
  improve: (text, instruction, options = {}) => api.post('/ai/improve', {
    text,
    instruction: instruction || 'Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.',
    temperature: options.temperature || 0.7,
    writing_style: options.writingStyle || 'puitis',
    model: options.model || 'openai/gpt-oss-120b',
  }),
  suggestTitle: (content, options = {}) => api.post('/ai/suggest-title', {
    content,
    title_style: options.titleStyle || 'click_bait',
    temperature: options.temperature || 0.7,
    model: options.model || 'openai/gpt-oss-120b',
  }),
  liveReview: (content, options = {}) => api.post('/ai/live-review', {
    content,
    temperature: options.temperature || 0.7,
    model: options.model || 'openai/gpt-oss-120b',
  }),
  status: () => api.get('/ai/status'),
};

// Settings
export const settingsAPI = {
  getDefaultPrompts: () => api.get('/settings/default-prompts').then(res => res.data),
  getMySettings: () => api.get('/settings/me').then(res => res.data),
  updateMySettings: (data) => api.put('/settings/me', data).then(res => res.data),
};

export default api;
