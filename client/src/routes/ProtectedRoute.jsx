import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ roles, permissions }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTES.LOGIN} />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate replace to={ROUTES.DASHBOARD} />;
  }

  if (user?.role !== 'Super Admin' && permissions?.length) {
    const hasPermission = permissions.some(p => user?.permissions?.includes(p));
    if (!hasPermission) {
      return <Navigate replace to={ROUTES.DASHBOARD} />;
    }
  }

  return <Outlet />;
}
