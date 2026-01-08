import { useState } from "react";
import { useAdminUsers, useDeactivateAdminUser, useReactivateAdminUser, useResendAdminCredentials, useDeleteAdminUser } from "@/hooks/queries/useAdminUsers";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, UserCheck, UserX, Edit, MailWarning, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { NuevoUsuarioDialog } from "@/components/usuarios/NuevoUsuarioDialog";
import { InviteUserDialog } from "@/components/usuarios/InviteUserDialog";
import { EditarUsuarioDialog } from "@/components/usuarios/EditarUsuarioDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ReenviarCredencialesDialog } from "@/components/usuarios/ReenviarCredencialesDialog";
import { CredencialesResultDialog } from "@/components/usuarios/CredencialesResultDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Usuarios() {
  const { adminUser } = useAuth();
  const { canManageUsers } = useSimpleAuth();
  const { data: usuarios = [], isLoading } = useAdminUsers();
  const { mutate: deactivateUser } = useDeactivateAdminUser();
  const { mutate: reactivateUser } = useReactivateAdminUser();
  const { mutate: resendCredentials, isPending: isResending } = useResendAdminCredentials();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteAdminUser();

  const [nuevoDialogOpen, setNuevoDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editarDialog, setEditarDialog] = useState<{ open: boolean; user?: any }>({ open: false });
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; user?: any }>({ open: false });
  const [resendDialog, setResendDialog] = useState<{ open: boolean; user?: any }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user?: any }>({ open: false });
  const [confirmText, setConfirmText] = useState("");
  const [resultDialog, setResultDialog] = useState<{ 
    open: boolean; 
    user?: any;
    temporaryPassword?: string;
    actionLink?: string | null;
    emailSent?: boolean;
  }>({ open: false });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/10 text-purple-500';
      case 'admin': return 'bg-blue-500/10 text-blue-500';
      case 'viewer': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrador',
      viewer: 'Visor',
    };
    return labels[role] || role;
  };

  const handleDeactivate = () => {
    if (deactivateDialog.user) {
      deactivateUser(deactivateDialog.user.user_id, {
        onSuccess: () => setDeactivateDialog({ open: false }),
      });
    }
  };

  const handleReactivate = (user: any) => {
    reactivateUser(user.user_id);
  };

  const handleResendCredentials = () => {
    if (resendDialog.user) {
      resendCredentials(resendDialog.user.user_id, {
        onSuccess: (result) => {
          setResendDialog({ open: false });
          setResultDialog({ 
            open: true, 
            user: resendDialog.user,
            temporaryPassword: result.temporary_password,
            actionLink: result.action_link,
            emailSent: result.email_sent
          });
        },
      });
    }
  };

  const handleDeleteUser = () => {
    if (deleteDialog.user && confirmText === "ELIMINAR") {
      deleteUser(deleteDialog.user.user_id, {
        onSuccess: () => {
          setDeleteDialog({ open: false });
          setConfirmText("");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Usuarios" icon={Users} />
        <Card>
          <CardContent className="pt-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 mb-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle={`${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} en el sistema`}
        icon={Users}
        actions={
          canManageUsers && (
            <Button onClick={() => setNuevoDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        {user.needs_credentials && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Debe cambiar contraseña
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500">
                        <UserX className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.last_login
                      ? formatDistanceToNow(new Date(user.last_login), {
                          addSuffix: true,
                          locale: es,
                        })
                      : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canManageUsers && (
                        <>
                          {user.needs_credentials && !user.last_login && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResendDialog({ open: true, user })}
                              title="Reenviar invitación"
                            >
                              <MailWarning className="h-4 w-4 text-warning" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditarDialog({ open: true, user })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeactivateDialog({ open: true, user })}
                              disabled={user.user_id === adminUser?.user_id}
                            >
                              <UserX className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactivate(user)}
                              >
                                <UserCheck className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, user })}
                                disabled={user.user_id === adminUser?.user_id}
                                title="Eliminar permanentemente"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <NuevoUsuarioDialog open={nuevoDialogOpen} onOpenChange={setNuevoDialogOpen} />

      {editarDialog.user && (
        <EditarUsuarioDialog
          open={editarDialog.open}
          onOpenChange={(open) => setEditarDialog({ open, user: editarDialog.user })}
          user={editarDialog.user}
        />
      )}

      <ConfirmDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ ...deactivateDialog, open })}
        onConfirmar={handleDeactivate}
        titulo="Desactivar Usuario"
        descripcion={`¿Estás seguro de desactivar a ${deactivateDialog.user?.full_name}? El usuario no podrá iniciar sesión.`}
        variant="destructive"
      />

      {resendDialog.user && (
        <ReenviarCredencialesDialog
          open={resendDialog.open}
          onOpenChange={(open) => setResendDialog({ open, user: resendDialog.user })}
          userName={resendDialog.user.full_name}
          userEmail={resendDialog.user.email}
          onConfirm={handleResendCredentials}
          isLoading={isResending}
        />
      )}

      {resultDialog.user && (
        <CredencialesResultDialog
          open={resultDialog.open}
          onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}
          userName={resultDialog.user.full_name}
          userEmail={resultDialog.user.email}
          temporaryPassword={resultDialog.temporaryPassword || ''}
          actionLink={resultDialog.actionLink || null}
          emailSent={resultDialog.emailSent || false}
        />
      )}

      <Dialog open={deleteDialog.open} onOpenChange={(open) => {
        setDeleteDialog({ ...deleteDialog, open });
        if (!open) setConfirmText("");
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Eliminar Usuario Permanentemente
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-semibold text-destructive mb-2">⚠️ ADVERTENCIA: Esta acción es PERMANENTE e IRREVERSIBLE</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Se eliminará el usuario del sistema de autenticación</li>
                  <li>• Se perderán todos sus datos de acceso</li>
                  <li>• No podrá volver a iniciar sesión</li>
                  <li>• Esta acción no se puede deshacer</li>
                </ul>
              </div>
              
              {deleteDialog.user && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Usuario a eliminar:</p>
                  <p className="text-sm"><span className="font-semibold">Nombre:</span> {deleteDialog.user.full_name}</p>
                  <p className="text-sm"><span className="font-semibold">Email:</span> {deleteDialog.user.email}</p>
                  <p className="text-sm"><span className="font-semibold">Rol:</span> {getRoleLabel(deleteDialog.user.role)}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Para confirmar, escribe <span className="font-mono font-medium text-destructive">ELIMINAR</span> en el campo de abajo:</p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  className="font-mono"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog({ open: false });
                setConfirmText("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={confirmText !== "ELIMINAR" || isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
