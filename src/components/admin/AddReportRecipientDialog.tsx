import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2 } from 'lucide-react';
import { 
  useAddReportRecipient, 
  REPORT_TYPES,
  type ReportType 
} from '@/hooks/queries/useReportEmailRecipients';

const formSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  name: z.string().optional(),
  report_type: z.string().min(1, 'Tipo de reporte requerido'),
});

type FormData = z.infer<typeof formSchema>;

interface AddReportRecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReportType?: ReportType;
}

export function AddReportRecipientDialog({
  open,
  onOpenChange,
  defaultReportType = 'hours_daily',
}: AddReportRecipientDialogProps) {
  const addRecipient = useAddReportRecipient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      report_type: defaultReportType,
    },
  });

  const onSubmit = async (data: FormData) => {
    await addRecipient.mutateAsync({
      email: data.email,
      name: data.name || undefined,
      report_type: data.report_type,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Destinatario</DialogTitle>
          <DialogDescription>
            Añade una nueva persona para recibir este reporte automático
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="ejemplo@capittal.es" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre para mostrar" {...field} />
                  </FormControl>
                  <FormDescription>
                    Opcional. Usado para referencia interna.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="report_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Reporte *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REPORT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El destinatario recibirá este tipo de reporte
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={addRecipient.isPending}
              >
                {addRecipient.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Añadir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
