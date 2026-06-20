import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

/** Gates nested routes behind authentication. */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
