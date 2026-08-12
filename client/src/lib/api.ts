import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already retried this request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = Cookies.get('refreshToken');
      
      // Don't try to refresh if the request was to the refresh endpoint itself
      if (refreshToken && originalRequest.url !== '/auth/refresh') {
        try {
          // Use axios directly to avoid interceptor loop
          const res = await axios.post('http://localhost:5000/api/auth/refresh', {
            refreshToken
          });
          
          if (res.status === 200) {
            const newAccessToken = res.data.accessToken;
            Cookies.set('accessToken', newAccessToken, { expires: 15 / (24 * 60) });
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails (e.g. token expired/revoked), log out
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.replace('/login');
          }
          return Promise.reject(refreshError);
        }
      }
      
      // No refresh token available, or we are the refresh endpoint failing
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
