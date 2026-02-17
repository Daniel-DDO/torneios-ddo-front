import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

// --- CONFIGURAÇÃO DO BACKEND PRINCIPAL (NODE) ---
const SERVERS = [
  'https://torneios-ddo-backend.onrender.com',
  'https://torneios-ddo-599q.onrender.com'
];

const MICROSERVICE_URL = 'https://backend2torneios.onrender.com';

let currentServerIndex = Math.floor(Math.random() * SERVERS.length);

console.log(`Iniciando conexão principal com: ${SERVERS[currentServerIndex]}`);

const axiosInstance = axios.create({
  baseURL: SERVERS[currentServerIndex],
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const microserviceInstance = axios.create({
  baseURL: MICROSERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

axiosInstance.interceptors.request.use(
  (config) => {
    config.baseURL = SERVERS[currentServerIndex];
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

microserviceInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      handleLogout();
      return Promise.reject(error);
    }

    if (originalRequest && !originalRequest._retry && shouldSwitchServer(error)) {
      originalRequest._retry = true; 
      currentServerIndex = (currentServerIndex + 1) % SERVERS.length;
      const newUrl = SERVERS[currentServerIndex];
      console.warn(`Erro no servidor principal. Trocando rota para: ${newUrl}`);
      originalRequest.baseURL = newUrl;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

microserviceInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
      return Promise.reject(error);
    }
);

function handleLogout() {
    console.warn('Sessão expirada. Logout...');
    localStorage.removeItem('token');
    window.location.href = '/';
}

function shouldSwitchServer(error: AxiosError) {
  if (!error.response) return true; 
  const status = error.response.status;
  return status >= 500 && status < 600;
}

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

export const API_SECUNDARIA = {
    get(endpoint: string, config?: AxiosRequestConfig) {
        return microserviceInstance.get(endpoint, config);
    },
    post(endpoint: string, data?: any, config?: AxiosRequestConfig) {
        return microserviceInstance.post(endpoint, data, config);
    },
    put(endpoint: string, data?: any, config?: AxiosRequestConfig) {
        return microserviceInstance.put(endpoint, data, config);
    },
    delete(endpoint: string, config?: AxiosRequestConfig) {
        return microserviceInstance.delete(endpoint, config);
    }
};