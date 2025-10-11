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
      toast.info(`Contraseña temporal: ${result.temporary_password}`, {
        duration: 15000,
        description: 'Guarda esta contraseña, no se volverá a mostrar.',
      });
    },
    onError: (error) => {
      handleError(error, 'Error al crear usuario');
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
