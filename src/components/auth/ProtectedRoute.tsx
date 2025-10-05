import { Navigate } from 'react-router-dom';
import { useAuth, AdminRole } from '@/hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, adminUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !adminUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!adminUser.is_active) {
    return <AccessDenied message="Tu cuenta está desactivada. Contacta al administrador." />;
  }

  // Check role hierarchy: super_admin > admin > editor > viewer
  if (requiredRole) {
    const roleHierarchy: Record<AdminRole, number> = {
      super_admin: 4,
      admin: 3,
      editor: 2,
      viewer: 1,
    };

    const userLevel = roleHierarchy[adminUser.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <AccessDenied message="No tienes permisos suficientes para acceder a esta página." />;
    }
  }

  return <>{children}</>;
}
