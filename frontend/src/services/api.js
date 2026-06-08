import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
 const envUrl = process.env.EXPO_PUBLIC_API_URL;
 if (envUrl) return envUrl;

 if (Platform.OS === 'android') {
  return 'http://10.0.2.2:5000/api';
 }

 return 'http://localhost:5000/api';
};

const api = axios.create({
 baseURL: getApiBaseUrl(),
 timeout: 10000,
});

api.interceptors.request.use(async (config) => {
 const token = await AsyncStorage.getItem('token');
 if (token) config.headers.Authorization = `Bearer ${token}`;
 console.log(`[API] ${String(config.method || 'GET').toUpperCase()} ${config.baseURL}${config.url}`);
 return config;
});

api.interceptors.response.use(
 response => {
  console.log('[API RESPONSE STATUS]', response.status);
  console.log('[API RESPONSE BODY]', response.data);
  return response;
 },
 error => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;
  console.error('[API ERROR]', {
   url: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
   status,
   message,
   body: error.response?.data,
  });
  return Promise.reject(error);
 }
);

export default api;
