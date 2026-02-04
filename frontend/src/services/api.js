import axios from 'axios';

// Exponential backoff configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const TIMEOUT = 30000; // 30 seconds

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(retryCount) {
  const exponentialDelay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY
  );
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return exponentialDelay + jitter;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx server errors and 429 rate limit
  return status >= 500 || status === 429;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Initialize retry count
  config.retryCount = config.retryCount || 0;
  return config;
});

// Handle retries and auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 401 auth errors (no retry)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event for auth failure - allows React components to handle redirect safely
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { error } }));
      return Promise.reject(error);
    }

    // Check if we should retry
    if (config && isRetryableError(error) && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(config.retryCount - 1);

      // Log retry attempt
      console.log(
        `Retry attempt ${config.retryCount}/${MAX_RETRIES} after ${Math.round(delay)}ms for ${config.url}`
      );

      // Wait before retrying
      await sleep(delay);

      // Retry the request
      return api(config);
    }

    // No more retries or non-retryable error
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
