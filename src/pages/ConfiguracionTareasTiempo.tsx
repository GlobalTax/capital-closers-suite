import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  GripVertical,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { 
  useAllWorkTaskTypes, 
  useCreateWorkTaskType, 
  useUpdateWorkTaskType,
  useToggleWorkTaskTypeActive,
  type WorkTaskType 
} from "@/hooks/useWorkTaskTypes";

export default function ConfiguracionTareasTiempo() {
  const { data: taskTypes = [], isLoading } = useAllWorkTaskTypes();
  const createMutation = useCreateWorkTaskType();
  const updateMutation = useUpdateWorkTaskType();
  const toggleMutation = useToggleWorkTaskTypeActive();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTaskType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: WorkTaskType) => {
    setEditingTask(task);
    setFormData({ name: task.name, description: task.description || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingTask) {
      await updateMutation.mutateAsync({
        id: editingTask.id,
        data: { 
          name: formData.name.trim(), 
          description: formData.description.trim() || null 
        }
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
    }
    
    setIsDialogOpen(false);
    setFormData({ name: '', description: '' });
    setEditingTask(null);
  };

  const handleToggleActive = async (task: WorkTaskType) => {
    await toggleMutation.mutateAsync({
      id: task.id,
      isActive: !task.is_active
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tipos de Tarea"
          description="Configura los tipos de tarea disponibles para el registro de tiempo"
          icon={Clock}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Catálogo de Tipos de Tarea</CardTitle>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : taskTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay tipos de tarea configurados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-24 text-center">Estado</TableHead>
                    <TableHead className="w-24 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskTypes.map((task, index) => (
                    <TableRow 
                      key={task.id}
                      className={!task.is_active ? "opacity-50" : ""}
                    >
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {task.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {task.description || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {task.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={task.is_active}
                            onCheckedChange={() => handleToggleActive(task)}
                            disabled={toggleMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tipo de Tarea" : "Nuevo Tipo de Tarea"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Due Diligence, Negociación..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción breve del tipo de tarea..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingTask ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
