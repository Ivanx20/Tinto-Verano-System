import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4100/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<(token?: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const requestUrl = String(original?.url ?? '');
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/logout');

    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            if (token) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      try {
        isRefreshing = true;
        const { data } = await api.post('/auth/refresh');
        const token = data.data.accessToken as string | undefined;
        if (token) useAuthStore.getState().setAccessToken(token);
        queue.forEach((cb) => cb(token));
        queue = [];
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().logoutLocal();
        queue.forEach((cb) => cb());
        queue = [];
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
    throw error;
  }
);

export type ApiList<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export async function getList<T>(endpoint: string, search = '') {
  const { data } = await api.get<{ data: ApiList<T> }>(endpoint, { params: { search, limit: 50 } });
  return data.data;
}

export async function createRecord<T>(endpoint: string, payload: unknown) {
  const { data } = await api.post<{ data: T }>(endpoint, payload);
  return data.data;
}

export async function updateRecord<T>(endpoint: string, id: number, payload: unknown) {
  const { data } = await api.put<{ data: T }>(`${endpoint}/${id}`, payload);
  return data.data;
}

export async function deleteRecord(endpoint: string, id: number) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data.data;
}
