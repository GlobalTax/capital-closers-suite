import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginSchema } from '@/lib/validation/auth-schemas';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar con Zod schema
    const result = loginSchema.safeParse({ email, password });
    
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || 'Datos inválidos';
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);

    const { error } = await login(result.data.email, result.data.password);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success('Inicio de sesión exitoso');
      navigate('/mandatos');
    }
  };

  return (
    <AuthLayout
      title="Iniciar Sesión"
      description="Accede a la plataforma de cierre de operaciones"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Olvidaste tu contraseña?{' '}
          <span className="text-primary font-medium">
            Contacta al administrador
          </span>
        </p>
      </form>
    </AuthLayout>
  );
}
