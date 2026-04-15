import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's default page
    const defaultPage =
      user.role === 'admin' ? '/admin' :
      user.role === 'moderator' ? '/moderator' :
      '/dashboard';
    return <Navigate to={defaultPage} replace />;
  }

  return children;
}
