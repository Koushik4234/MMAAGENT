import { request } from './http.js';

export const api = {
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),
  personas: () => request('/api/personas'),
  overview: () => request('/api/dashboard/overview'),
  trends: (days) => request(`/api/dashboard/trends?days=${days}`),
  sessions: (limit = 25, offset = 0) => request(`/api/dashboard/sessions?limit=${limit}&offset=${offset}`),
  sessionDetail: (id) => request(`/api/dashboard/sessions/${id}`),
};
