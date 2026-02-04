import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Trash2, 
  Send, 
  Mail, 
  Clock, 
  Calendar,
  Loader2,
  Users
} from 'lucide-react';
import { 
  useReportEmailRecipients, 
  useUpdateReportRecipient, 
  useDeleteReportRecipient,
  useSendTestReport,
  REPORT_TYPES,
  type ReportType 
} from '@/hooks/queries/useReportEmailRecipients';
import { AddReportRecipientDialog } from '@/components/admin/AddReportRecipientDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReportesEmail() {
  const [selectedType, setSelectedType] = useState<ReportType>('hours_daily');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: recipients, isLoading } = useReportEmailRecipients(selectedType);
  const updateRecipient = useUpdateReportRecipient();
  const deleteRecipient = useDeleteReportRecipient();
  const sendTestReport = useSendTestReport();

  const handleToggleActive = (id: string, currentValue: boolean) => {
    updateRecipient.mutate({ id, is_active: !currentValue });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteRecipient.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSendTest = () => {
    sendTestReport.mutate(selectedType);
  };

  const activeCount = recipients?.filter(r => r.is_active).length || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes por Email</h1>
          <p className="text-muted-foreground">
            Gestiona los destinatarios de los reportes automáticos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={sendTestReport.isPending || activeCount === 0}
          >
            {sendTestReport.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar prueba
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir destinatario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Destinatarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{activeCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">08:00 (L-V)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipo de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">
                {REPORT_TYPES.find(t => t.value === selectedType)?.label}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ReportType)}>
        <TabsList>
          {REPORT_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value}>
              <Mail className="h-4 w-4 mr-2" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {REPORT_TYPES.map(type => (
          <TabsContent key={type.value} value={type.value}>
            <Card>
              <CardHeader>
                <CardTitle>{type.label}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recipients?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay destinatarios configurados</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir primer destinatario
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Añadido</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients?.map(recipient => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-medium">
                            {recipient.email}
                          </TableCell>
                          <TableCell>
                            {recipient.name || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={recipient.is_active}
                                onCheckedChange={() => handleToggleActive(recipient.id, recipient.is_active)}
                                disabled={updateRecipient.isPending}
                              />
                              <Badge variant={recipient.is_active ? 'default' : 'secondary'}>
                                {recipient.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(recipient.created_at), "d MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(recipient.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Dialog */}
      <AddReportRecipientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultReportType={selectedType}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar destinatario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El destinatario dejará de recibir este reporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
