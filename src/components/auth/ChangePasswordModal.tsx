import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

export function ChangePasswordModal() {
  const { adminUser, setInitialPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const open = adminUser?.needs_credentials === true;

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);

    return {
      hasMinLength,
      hasUpperCase,
      hasNumber,
      hasSpecialChar: true, // Ya no requerido
      isValid: hasMinLength && hasUpperCase && hasNumber,
    };
  };

  const validation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      toast.error('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
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
            <ValidationItem isValid={validation.hasMinLength} text="Mínimo 8 caracteres" />
            <ValidationItem isValid={validation.hasUpperCase} text="Al menos una mayúscula" />
            <ValidationItem isValid={validation.hasNumber} text="Al menos un número" />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !validation.isValid}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
