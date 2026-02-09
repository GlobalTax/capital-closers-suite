import { Navigate } from 'react-router-dom';
import { useAuth, AdminRole } from '@/hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';
import { AccessDenied } from './AccessDenied';
import { ConfidentialityAgreementModal } from './ConfidentialityAgreementModal';
import { useConfidentialityAgreement } from '@/hooks/useConfidentialityAgreement';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, adminUser, loading, session } = useAuth();
  const { hasAccepted, isLoading: isLoadingAgreement } = useConfidentialityAgreement();

  if (loading || isLoadingAgreement) {
    return <LoadingScreen />;
  }

  if (!user || !adminUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!adminUser.is_active) {
    return <AccessDenied message="Tu cuenta está desactivada. Contacta al administrador." />;
  }

  // Check role hierarchy: super_admin > admin > viewer
  if (requiredRole) {
    const roleHierarchy: Record<AdminRole, number> = {
      super_admin: 3,
      admin: 2,
      viewer: 1,
    };

    const jwtRole = session?.user?.app_metadata?.role as AdminRole | undefined;
    const effectiveRole = jwtRole || adminUser.role;
    const userLevel = roleHierarchy[effectiveRole] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <AccessDenied message="No tienes permisos suficientes para acceder a esta página." />;
    }
  }

  // Block access until confidentiality agreement is accepted
  if (!hasAccepted) {
    return <ConfidentialityAgreementModal />;
  }

  return <>{children}</>;
}
