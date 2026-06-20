import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { bootstrapAuth } from './lib/auth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

function App() {
  // Restore any existing session (via the refresh cookie) before rendering
  // routes, so a logged-in user isn't briefly bounced to /login on reload.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Loading…</p>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
