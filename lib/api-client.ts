// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://194.163.158.235:3000', // IP de tu VPS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el Token automáticamente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tito_token'); // 👈 Asegúrate que el nombre coincida aquí
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;