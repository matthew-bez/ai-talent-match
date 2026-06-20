import { api } from './api';
import { useAuthStore, type AuthUser } from '../stores/auth.store';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<void> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  useAuthStore.getState().setAuth(data.user, data.accessToken);
}

export async function login(input: LoginInput): Promise<void> {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  useAuthStore.getState().setAuth(data.user, data.accessToken);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    useAuthStore.getState().clearAuth();
  }
}

/**
 * Restores a session on app load. With no access token in memory, GET /auth/me
 * 401s, the response interceptor silently refreshes using the cookie, then
 * retries — so a valid refresh cookie transparently rehydrates the session.
 * No cookie => clears auth and the user lands on /login.
 */
export async function bootstrapAuth(): Promise<void> {
  try {
    const { data } = await api.get<AuthUser>('/auth/me');
    const token = useAuthStore.getState().accessToken;
    if (token) {
      useAuthStore.getState().setAuth(data, token);
    } else {
      useAuthStore.getState().clearAuth();
    }
  } catch {
    useAuthStore.getState().clearAuth();
  }
}
