import axios from 'axios';

// Tu Gateway
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'; 

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👈 NUEVO: Interceptor para inyectar el token automáticamente
apiClient.interceptors.request.use((config) => {
  // Verificamos que estamos en el navegador (Next.js usa SSR)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tito_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiClient;