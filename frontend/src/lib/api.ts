import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../stores/auth.store';

const baseURL = import.meta.env.VITE_API_URL;

/** Main client: carries the access token and the refresh cookie. */
export const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh cookie
});

/**
 * Bare client used only to hit /auth/refresh. Kept separate so the refresh call
 * itself never passes through the interceptors below (which would recurse).
 */
const refreshClient = axios.create({ baseURL, withCredentials: true });

// --- Request: attach the access token ---------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response: silent refresh + retry on 401 --------------------------------

// Shared in-flight refresh so concurrent 401s trigger only one refresh call.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then((res) => {
        const token = res.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const shouldRefresh =
      error.response?.status === 401 && original && !original._retry;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const token = await refreshAccessToken();
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${token}`,
      };
      return api(original);
    } catch (refreshError) {
      // Refresh failed — the session is gone. Clearing auth flips
      // isAuthenticated, so ProtectedRoute redirects to /login.
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
