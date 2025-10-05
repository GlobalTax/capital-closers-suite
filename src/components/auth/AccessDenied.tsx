import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
}

export function AccessDenied({ message = 'No tienes acceso a esta página' }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Acceso Denegado</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button onClick={() => navigate('/mandatos')} variant="outline">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
