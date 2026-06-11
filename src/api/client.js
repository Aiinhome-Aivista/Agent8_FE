// src/api/client.js
// Central Axios instance — auto-attaches JWT, handles 401 logout

import axios from 'axios';

const BASE_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insureai_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('insureai_token');
      localStorage.removeItem('insureai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// --- API helpers ---

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const chatAPI = {
  send: (data) => api.post('/chat', data, { timeout: 120000 }),
  history: (params) => api.get('/chat/history', { params }),
  sessions: () => api.get('/chat/sessions'),
  clear: () => api.delete('/chat/history'),
};

export const policyAPI = {
  list: () => api.get('/policies'),
  get: (id) => api.get(`/policies/${id}`),
  coverage: (id) => api.get(`/policies/${id}/coverage`),
};

export const renewalAPI = {
  renew: (data) => api.post('/renewals', data),
  list: () => api.get('/renewals'),
};

export const endorsementAPI = {
  create: (data) => api.post('/endorsements', data),
  list: () => api.get('/endorsements'),
};

export const escalationAPI = {
  create: (data) => api.post('/escalations', data),
  list: (params) => api.get('/escalations', { params }),
  get: (id) => api.get(`/escalations/${id}`),
  update: (id, data) => api.patch(`/escalations/${id}`, data),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const dashboardAPI = {
  customer: () => api.get('/dashboard/customer'),
  csr: () => api.get('/dashboard/csr'),
  supervisor: () => api.get('/dashboard/supervisor'),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/documents'),
  ask: (data) => api.post('/documents/ask', data),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const complianceAPI = {
  auditLogs: (params) => api.get('/compliance/audit-logs', { params }),
  guardrailViolations: (params) => api.get('/compliance/guardrail-violations', { params }),
  sensitiveActions: () => api.get('/compliance/sensitive-actions'),
  summary: () => api.get('/compliance/summary'),
  export: (params) => api.get('/compliance/export', { params, responseType: 'blob' }),
};
