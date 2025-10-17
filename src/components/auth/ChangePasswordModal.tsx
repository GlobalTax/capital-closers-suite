import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';
import { 
  setInitialPasswordSchema, 
  getPasswordValidationErrors,
  calculatePasswordStrength 
} from '@/lib/validation/auth-schemas';

export function ChangePasswordModal() {
  const { adminUser, setInitialPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const open = adminUser?.needs_credentials === true;

  const validationErrors = getPasswordValidationErrors(newPassword);
  const passwordStrength = calculatePasswordStrength(newPassword);
  const isPasswordValid = validationErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar con Zod schema
    const result = setInitialPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || 'Datos inválidos';
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);

    const { error } = await setInitialPassword(newPassword);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success('Contraseña configurada. Por favor inicia sesión nuevamente.');
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={isValid ? 'text-green-500' : 'text-muted-foreground'}>{text}</span>
    </div>
  );

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">Requisitos de contraseña:</p>
            <ValidationItem isValid={newPassword.length >= 12} text="Mínimo 12 caracteres" />
            <ValidationItem isValid={/[A-Z]/.test(newPassword)} text="Al menos una mayúscula" />
            <ValidationItem isValid={/[a-z]/.test(newPassword)} text="Al menos una minúscula" />
            <ValidationItem isValid={/[0-9]/.test(newPassword)} text="Al menos un número" />
            <ValidationItem isValid={/[^A-Za-z0-9]/.test(newPassword)} text="Al menos un carácter especial" />
            
            {newPassword && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Fortaleza:</span>
                  <span className={
                    passwordStrength >= 80 ? 'text-green-500 font-medium' :
                    passwordStrength >= 60 ? 'text-yellow-500 font-medium' :
                    'text-red-500 font-medium'
                  }>
                    {passwordStrength >= 80 ? 'Fuerte' : passwordStrength >= 60 ? 'Media' : 'Débil'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      passwordStrength >= 80 ? 'bg-green-500' :
                      passwordStrength >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
