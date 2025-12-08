import axios from 'axios';

const API_BASE_URL = 'https://torneios-ddo-back.onrender.com';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
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

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const API = {
  get(endpoint: string, params?: Record<string, any>) {
    return axiosInstance.get(endpoint, { params });
  },

  post(endpoint: string, data?: Record<string, any>) {
    return axiosInstance.post(endpoint, data);
  },

  put(endpoint: string, data?: Record<string, any>) {
    return axiosInstance.put(endpoint, data);
  },

  delete(endpoint: string) {
    return axiosInstance.delete(endpoint);
  },

  patch(endpoint: string, data?: Record<string, any>) {
    return axiosInstance.patch(endpoint, data);
  }
};