import axios from 'axios';

// Local dev talks to the Express server on :5000; deployed builds are
// served by the same Express process, so API calls stay same-origin.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:5000/api');

// Demo mode: only when explicitly enabled AND the API is unreachable.
// Any real HTTP error response (400/401/403/500) is surfaced to the user.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const isNetworkError = (err) => !err?.response;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // NOTE: no default Content-Type — axios sets application/json for object
  // payloads automatically, and a preset json header would make axios
  // serialize FormData (profile photo uploads) to JSON instead of
  // multipart, which the server rejects.
  timeout: 8000,
});

// Dev-only request logging: method, URL, status and backend message.
// Never logs request/response bodies, so passwords and tokens stay out.
const isDev = import.meta.env.DEV;

if (isDev) {
  apiClient.interceptors.request.use(
    (config) => {
      config.metadata = { startTime: performance.now() };
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => {
      const { method, url } = response.config;
      const ms = Math.round(performance.now() - (response.config.metadata?.startTime || performance.now()));
      const message = response.data?.message;
      console.log(`[API] ${method?.toUpperCase()} ${url} -> ${response.status}${message ? ` (${message})` : ''} [${ms}ms]`);
      return response;
    },
    (error) => {
      const { method, url } = error.config || {};
      const status = error.response?.status ?? 'NET';
      const message = error.response?.data?.message || error.message;
      console.warn(`[API] ${method?.toUpperCase()} ${url} -> ${status} (${message})`);
      return Promise.reject(error);
    }
  );
}

// Interceptor to inject JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flowzen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global response errors (e.g. 401 unauth / expired token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('flowzen_token');
      localStorage.removeItem('flowzen_user');
      if (window.location.pathname !== '/auth') {
        window.location.assign('/auth');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
