import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Set after a successful login/register. */
  setAuth: (user: AuthUser, accessToken: string) => void;
  /** Update just the access token (used after a silent refresh). */
  setAccessToken: (accessToken: string) => void;
  /** Wipe the in-memory session (logout or failed refresh). */
  clearAuth: () => void;
}

// Tokens live in memory only — never persisted — so a stolen localStorage entry
// can't leak them. The session is restored on reload via the refresh cookie.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) =>
    set({ accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
