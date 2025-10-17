import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, User, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const acceptInvitationSchema = z.object({
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    full_name: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const form = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token de invitación no válido');
        setIsLoading(false);
        return;
      }

      try {
        // Validar token usando edge function
        const { data, error: validateError } = await supabase.functions.invoke(
          'validate-invitation-token',
          {
            body: { token },
          }
        );

        if (validateError || !data || data.error) {
          setError(data?.error || 'Invitación no válida');
          setIsLoading(false);
          return;
        }

        setInvitation(data.invitation);
      } catch (err: any) {
        console.error('Error validando token:', err);
        setError('Error al validar la invitación');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormValues) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const { data: result, error: acceptError } = await supabase.functions.invoke(
        'accept-user-invitation',
        {
          body: {
            token,
            password: data.password,
          },
        }
      );

      if (acceptError) throw acceptError;

      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Ya puedes iniciar sesión con tu email y contraseña',
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { email: invitation?.email }
        });
      }, 2000);
    } catch (err: any) {
      console.error('Error aceptando invitación:', err);
      toast.error('Error al crear cuenta', {
        description: err.message || 'Ocurrió un error inesperado',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador',
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <AuthLayout title="Validando invitación..." description="Verificando tu invitación...">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout title="Error" description="Hubo un problema con tu invitación">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invitación no válida</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/auth/login')}
          variant="outline"
          className="w-full mt-4"
        >
          Volver al inicio de sesión
        </Button>
      </AuthLayout>
    );
  }

  if (!invitation) {
    return (
      <AuthLayout title="Error" description="No se pudo cargar la invitación">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No se pudo cargar la información de la invitación</AlertDescription>
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Aceptar Invitación" description="Completa el registro para acceder al sistema">
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Invitación válida</AlertTitle>
          <AlertDescription>
            Has sido invitado/a para unirte al sistema Capittal.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Nombre:</span>
            <span>{invitation.full_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Email:</span>
            <span>{invitation.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Rol:</span>
            <span>{getRoleLabel(invitation.role)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 12 caracteres con mayúsculas, minúsculas, números y caracteres especiales
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cuenta
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}
