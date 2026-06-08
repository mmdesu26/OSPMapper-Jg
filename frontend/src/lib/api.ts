import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

function unwrap(response: any) {
  return response?.data?.data ?? response?.data;
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');

    if (err.response?.status === 401 && typeof window !== 'undefined' && !isLoginRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (data: any) => api.post('/auth/login', data).then(unwrap),
  profile: () => api.get('/auth/profile').then(unwrap),
  logout: () => api.post('/auth/logout'),
};

// ── Assets ────────────────────────────────────────────────
const resource = (path: string) => ({
  list: (params?: any) => api.get(`/${path}`, { params }).then(r => r.data),
  get: (id: string) => api.get(`/${path}/${id}`).then(unwrap),
  create: (data: any) => api.post(`/${path}`, data).then(unwrap),
  update: (id: string, data: any) => api.patch(`/${path}/${id}`, data).then(unwrap),
  remove: (id: string) => api.delete(`/${path}/${id}`),
  stats: () => api.get(`/${path}/stats`).then(unwrap),
});

export const siteApi = resource('site');
export const odcApi = resource('odc');
export const odpApi = resource('odp');
export const jcApi = resource('jc');
export const tiangApi = resource('tiang');

export const kabelApi = {
  ...resource('kabel'),
  getCores: (id: string) => api.get(`/kabel/${id}/core`).then(unwrap),
  updateCore: (id: string, n: number, data: any) =>
    api.patch(`/kabel/${id}/core/${n}`, data).then(unwrap),
};

export const mapApi = {
  assets: () => api.get('/map/assets').then(unwrap),
  dashboard: (params?: { months?: string }) =>
    api.get('/map/dashboard', { params }).then(unwrap),
};