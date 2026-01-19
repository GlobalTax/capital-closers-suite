import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersService, type CreateAdminUserDto, type UpdateAdminUserDto } from "@/services/adminUsers.service";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: () => adminUsersService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin_users', userId],
    queryFn: () => adminUsersService.getById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminUserDto) => adminUsersService.createTemporaryUser(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success(`Usuario creado: ${result.email}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Error desconocido';
      const status = error?.status;
      
      // Errores específicos por código HTTP
      if (status === 409 || errorMessage.includes('ya está registrado')) {
        toast.error('Email duplicado', {
          description: 'Este email ya existe en el sistema. Puedes editarlo desde la lista.',
        });
      } else if (status === 403) {
        toast.error('Sin permisos', {
          description: 'Solo los super administradores pueden crear usuarios.',
        });
      } else if (status === 401) {
        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente.',
        });
      } else if (status === 400) {
        toast.error('Datos inválidos', {
          description: errorMessage,
        });
      } else {
        toast.error('Error al crear usuario', {
          description: errorMessage,
        });
      }
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserDto }) =>
      adminUsersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuario actualizado correctamente');
    },
    onError: (error) => {
      handleError(error, 'Error al actualizar usuario');
    },
  });
}

export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuario desactivado correctamente');
    },
    onError: (error) => {
      handleError(error, 'Error al desactivar usuario');
    },
  });
}

export function useReactivateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuario reactivado correctamente');
    },
    onError: (error) => {
      handleError(error, 'Error al reactivar usuario');
    },
  });
}

export function useResendAdminCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.resendCredentials(userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      
      if (!result.email_sent) {
        toast.warning('El email no pudo ser enviado', {
          description: 'Usa el diálogo para compartir las credenciales manualmente',
        });
      } else {
        toast.success(`Credenciales enviadas a: ${result.email}`);
      }
    },
    onError: (error) => {
      handleError(error, 'Error al reenviar credenciales');
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.deleteUser(userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuario eliminado permanentemente', {
        description: `${result.deleted_user.email} ha sido eliminado del sistema`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Error al eliminar usuario';
      
      if (errorMessage.includes('No puedes eliminar tu propio usuario')) {
        toast.error('No puedes eliminar tu propio usuario', {
          description: 'Por seguridad, no puedes eliminar tu propia cuenta',
        });
      } else if (errorMessage.includes('Solo super_admin')) {
        toast.error('Sin permisos', {
          description: 'Solo los super administradores pueden eliminar usuarios',
        });
      } else if (errorMessage.includes('no encontrado')) {
        toast.error('Usuario no encontrado', {
          description: 'El usuario que intentas eliminar no existe',
        });
      } else {
        handleError(error, 'Error al eliminar usuario');
      }
    },
  });
}
