import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Configure axios defaults - direct API calls without proxy
axios.defaults.baseURL = API_CONFIG.BASE_URL;

console.log('Using direct API calls to:', API_CONFIG.BASE_URL);

// Note: In development mode with React.StrictMode, API calls may appear twice in console
// This is expected behavior and helps detect side effects

// Add request interceptor to set tenant ID on all requests
axios.interceptors.request.use(
  (config) => {
    // Get token and tenant ID from localStorage
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'default';
    
    // Ensure headers object exists
    config.headers = config.headers || {};
    
    // Set Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request with token:', token.substring(0, 15) + '...');
    } else {
      console.log('No auth token available for request');
    }
    
    // Include tenant ID header, but do not override if already provided by the caller
    if (!config.headers['x-tenant-id']) {
      config.headers['x-tenant-id'] = tenantId;
    }
    
    // Set default timeout
    if (!config.timeout) {
      config.timeout = API_CONFIG.REQUEST_CONFIG.TIMEOUT;
    }
    
    // Log for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request headers:', JSON.stringify(config.headers));
    console.log('Tenant ID being used:', config.headers['x-tenant-id']);
    
    // if (config.data) {
    //   console.log('Request payload:', JSON.stringify(config.data));
    // }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} for ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('API Error:', error);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    
    // Handle authentication errors - but not for login/register requests
    if (error.response && error.response.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/api/auth/login') || 
                           error.config?.url?.includes('/api/auth/register');
      
      if (!isAuthRequest) {
        console.log('Authentication error - clearing token and redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.log('Auth request failed - letting component handle the error');
      }
    }
    
    // Handle tenant errors
    if (error.response && error.response.status === 400 && 
        error.response.data?.error?.includes('Tenant ID')) {
      console.error('Tenant error:', error.response.data.error);
    }
    
    // Handle service unavailable
    if (error.response && error.response.status === 503) {
      console.error('Service unavailable:', error.response.data);
    }
    
    // Handle 500 internal server errors - retry for progress/stats endpoint once
    if (
      error.response && 
      error.response.status === 500 && 
      error.config.url === '/api/progress/stats' && 
      !error.config.__isRetryRequest
    ) {
      console.log('500 error on progress/stats - retrying once');
      const newConfig = { ...error.config, __isRetryRequest: true };
      return axios(newConfig);
    }
    
    return Promise.reject(error);
  }
);

export default axios; 