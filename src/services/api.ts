import axios, { type AxiosRequestConfig } from 'axios';

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
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const API = {
  get(endpoint: string, config?: AxiosRequestConfig) {
    return axiosInstance.get(endpoint, config);
  },

  post(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return axiosInstance.post(endpoint, data, config);
  },

  put(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return axiosInstance.put(endpoint, data, config);
  },

  delete(endpoint: string, config?: AxiosRequestConfig) {
    return axiosInstance.delete(endpoint, config);
  },

  patch(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return axiosInstance.patch(endpoint, data, config);
  }
};