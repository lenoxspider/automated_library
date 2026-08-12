import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already retried this request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh if the request was to the refresh endpoint itself
      if (originalRequest.url !== '/auth/refresh') {
        try {
          // Refresh token cookie is sent automatically via withCredentials;
          // a successful call also sets a fresh accessToken cookie server-side.
          await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });

          // Retry the original request; the browser attaches the new cookie automatically
          return api(originalRequest);
        } catch (refreshError) {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.replace('/login');
          }
          return Promise.reject(refreshError);
        }
      }

      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
