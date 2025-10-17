import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, User, Shield } from 'lucide-react';

const inviteUserSchema = z.object({
  email: z.string().email('Email inválido').max(254),
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer'], {
    required_error: 'Debes seleccionar un rol',
  }),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'editor',
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: InviteUserFormValues) => {
      const { data: result, error } = await supabase.functions.invoke('send-user-invitation', {
        body: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Invitación enviada correctamente', {
        description: `Se ha enviado un email a ${data.invitation.email}`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error enviando invitación:', error);
      toast.error('Error al enviar invitación', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const onSubmit = async (data: InviteUserFormValues) => {
    setIsSubmitting(true);
    try {
      await sendInvitationMutation.mutateAsync(data);
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

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      super_admin: 'Acceso total al sistema, gestión de usuarios',
      admin: 'Gestión completa de datos y configuración',
      editor: 'Puede crear y editar contenido',
      viewer: 'Solo puede ver información',
    };
    return descriptions[role] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invitar Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por email para que un nuevo usuario se una al sistema.
            El enlace expirará en 7 días.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Se enviará un enlace de invitación a este email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rol
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(['super_admin', 'admin', 'editor', 'viewer'] as const).map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{getRoleLabel(role)}</span>
                            <span className="text-xs text-muted-foreground">
                              {getRoleDescription(role)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define los permisos del usuario en el sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
