import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Moon, Sun, Monitor } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export default function Perfil() {
  const { adminUser, updatePassword } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!adminUser) return null;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      super_admin: 'bg-destructive text-destructive-foreground',
      admin: 'bg-primary text-primary-foreground',
      editor: 'bg-accent text-accent-foreground',
      viewer: 'bg-secondary text-secondary-foreground',
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Error de validación',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✓ Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsChangingPassword(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(adminUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{adminUser.full_name || 'Usuario'}</CardTitle>
              <CardDescription>{adminUser.email}</CardDescription>
              <div className="mt-2">
                <Badge className={getRoleBadgeColor(adminUser.role)}>
                  {getRoleLabel(adminUser.role)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Nombre completo</Label>
              <Input value={adminUser.full_name || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Correo electrónico</Label>
              <Input value={adminUser.email || ''} readOnly className="bg-muted" />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Último acceso</p>
              <p className="font-medium">{formatDate(adminUser.last_login)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Cuenta creada</p>
              <p className="font-medium">
                {new Date(adminUser.last_login || Date.now()).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {actualTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <CardTitle>Tema de la aplicación</CardTitle>
          </div>
          <CardDescription>
            Selecciona tu preferencia de tema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="justify-start"
            >
              <Sun className="mr-2 h-4 w-4" />
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="justify-start"
            >
              <Moon className="mr-2 h-4 w-4" />
              Oscuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="justify-start"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Cambiar contraseña</CardTitle>
          </div>
          <CardDescription>
            Actualiza tu contraseña de acceso (mínimo 12 caracteres, incluir mayúscula, número y símbolo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto"
            >
              {isChangingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
