import { useState } from "react";
import { useCreateAdminUser } from "@/hooks/queries/useAdminUsers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check } from "lucide-react";

interface NuevoUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevoUsuarioDialog({ open, onOpenChange }: NuevoUsuarioDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'editor' as 'super_admin' | 'admin' | 'editor' | 'viewer',
  });

  const [createdUser, setCreatedUser] = useState<{
    email: string;
    temporary_password: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const { mutate: createUser, isPending } = useCreateAdminUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData, {
      onSuccess: (result) => {
        setCreatedUser({
          email: result.email,
          temporary_password: result.temporary_password,
        });
      },
    });
  };

  const handleClose = () => {
    setFormData({ email: '', full_name: '', role: 'editor' });
    setCreatedUser(null);
    setCopied(false);
    onOpenChange(false);
  };

  const copyPassword = () => {
    if (createdUser) {
      navigator.clipboard.writeText(createdUser.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdUser ? 'Usuario Creado' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {createdUser
              ? 'Guarda la contraseña temporal, no se volverá a mostrar.'
              : 'Crea un nuevo usuario administrador del sistema.'}
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm mt-1">{createdUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contraseña Temporal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {createdUser.temporary_password}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={copyPassword}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ El usuario deberá cambiar su contraseña en el primer inicio de sesión.
                </p>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="usuario@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visor (solo lectura)</SelectItem>
                  <SelectItem value="editor">Editor (lectura/escritura)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
