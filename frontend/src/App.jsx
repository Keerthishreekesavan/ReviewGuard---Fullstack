import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import ModeratorPanel from './pages/ModeratorPanel';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';


function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const defaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'moderator') return '/moderator';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-surface-900">
      {user && <Navbar />}
      <main className={user ? 'pt-16' : ''}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to={defaultRoute()} replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={defaultRoute()} replace />} />

          {/* User routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Moderator routes */}
          <Route
            path="/moderator"
            element={
              <ProtectedRoute allowedRoles={['moderator', 'admin']}>
                <ModeratorPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['moderator', 'admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to={defaultRoute()} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
