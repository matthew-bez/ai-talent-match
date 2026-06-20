import { useNavigate } from 'react-router-dom';
import { logout } from '../../lib/auth';
import { useAuthStore } from '../../stores/auth.store';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'left' }}>
      <h1>Welcome{user?.firstName ? `, ${user.firstName}` : ''} 👋</h1>
      <p>Signed in as {user?.email}</p>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}
