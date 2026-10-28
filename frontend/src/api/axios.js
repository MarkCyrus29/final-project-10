import axios from 'axios';

// Get API base URL from Vite environment variables with fallback
const baseURL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:5000';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization Bearer token to every request if available
api.interceptors.request.use(
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

// If the server says our token is no longer valid (401), the saved session has expired.
// Clear it and send the user to sign in again instead of leaving them on a page full of errors.
// Skipped for the login and register calls (a 401 there just means wrong credentials)
// and for /api/auth/me (AuthContext handles that one when the app first loads).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = /\/api\/auth\/(login|register|me)/.test(url);

    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.assign('/login?expired=1');
    }

    return Promise.reject(error);
  }
);

export default api;
