import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  full_name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
  email: z.string()
    .min(1, "El email es obligatorio")
    .email("Email inválido"),
  role: z.enum(['super_admin', 'admin', 'viewer'], {
    required_error: "Selecciona un rol",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevoUsuarioDialog({ open, onOpenChange }: NuevoUsuarioDialogProps) {
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    temporary_password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      full_name: '',
      email: '',
      role: 'admin',
    },
  });

  const { mutate: createUser, isPending } = useCreateAdminUser();

  const onSubmit = (values: FormValues) => {
    createUser({
      full_name: values.full_name,
      email: values.email,
      role: values.role,
    }, {
      onSuccess: (result) => {
        setCreatedUser({
          email: result.email,
          temporary_password: result.temporary_password,
        });
      },
    });
  };

  const handleClose = () => {
    form.reset();
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

  const isFormValid = form.formState.isValid;

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
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm mt-1">{createdUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contraseña Temporal</p>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Indicador de campos obligatorios */}
              <p className="text-sm text-muted-foreground">
                <span className="text-destructive">*</span> Campos obligatorios
              </p>

              {/* Resumen de errores */}
              {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-sm text-destructive font-medium">
                    Por favor corrige los siguientes errores:
                  </p>
                  <ul className="text-sm text-destructive/80 mt-1 list-disc list-inside">
                    {Object.entries(form.formState.errors).map(([key, error]) => (
                      <li key={key}>{error?.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="usuario@empresa.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewer">Visor (solo lectura)</SelectItem>
                        <SelectItem value="admin">Administrador (gestión completa)</SelectItem>
                        <SelectItem value="super_admin">Super Administrador (control total)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          type="submit" 
                          disabled={isPending || !isFormValid}
                        >
                          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {isPending ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isFormValid && !isPending && (
                      <TooltipContent>
                        <p>Completa los campos obligatorios para continuar</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}