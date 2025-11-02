import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    max_tokens: options.maxTokens || 2000,
    temperature: options.temperature || 0.7,
    writing_style: options.writingStyle || 'puitis',
    paragraph_count: options.paragraphCount || 1,
    brief_idea: options.briefIdea || '',
  }),
  improve: (text, instruction, options = {}) => api.post('/ai/improve', {
    text,
    instruction: instruction || 'Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.',
    temperature: options.temperature || 0.7,
    writing_style: options.writingStyle || 'puitis',
  }),
  suggestTitle: (content, options = {}) => api.post('/ai/suggest-title', {
    content,
    title_style: options.titleStyle || 'click_bait',
    temperature: options.temperature || 0.7,
  }),
  status: () => api.get('/ai/status'),
};

export default api;
