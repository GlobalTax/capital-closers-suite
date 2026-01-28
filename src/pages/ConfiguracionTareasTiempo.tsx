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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  FileText,
  Users,
  ClipboardList,
  DollarSign
} from "lucide-react";
import { 
  useAllWorkTaskTypes, 
  useCreateWorkTaskType, 
  useUpdateWorkTaskType,
  useToggleWorkTaskTypeActive,
  type WorkTaskType,
  type WorkTaskTypeContext,
  type TimeEntryValueType
} from "@/hooks/useWorkTaskTypes";

interface FormData {
  name: string;
  description: string;
  context: WorkTaskTypeContext;
  default_value_type: TimeEntryValueType;
  require_mandato: boolean;
  require_lead: boolean;
  require_description: boolean;
  min_description_length: number;
  default_billable: boolean;
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  context: 'all',
  default_value_type: 'core_ma',
  require_mandato: true,
  require_lead: false,
  require_description: false,
  min_description_length: 20,
  default_billable: true,
};

const CONTEXT_OPTIONS: { value: WorkTaskTypeContext; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mandate', label: 'Mandatos' },
  { value: 'prospection', label: 'Prospección' },
  { value: 'internal', label: 'Interno' },
];

const VALUE_TYPE_OPTIONS: { value: TimeEntryValueType; label: string }[] = [
  { value: 'core_ma', label: 'Core M&A' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'bajo_valor', label: 'Bajo Valor' },
];

const getContextBadgeStyles = (context: WorkTaskTypeContext) => {
  switch (context) {
    case 'mandate':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'prospection':
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case 'internal':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getValueTypeBadgeStyles = (valueType: TimeEntryValueType) => {
  switch (valueType) {
    case 'core_ma':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'soporte':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'bajo_valor':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function ConfiguracionTareasTiempo() {
  const { data: taskTypes = [], isLoading } = useAllWorkTaskTypes();
  const createMutation = useCreateWorkTaskType();
  const updateMutation = useUpdateWorkTaskType();
  const toggleMutation = useToggleWorkTaskTypeActive();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTaskType | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: WorkTaskType) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      context: task.context,
      default_value_type: task.default_value_type || 'core_ma',
      require_mandato: task.require_mandato,
      require_lead: task.require_lead,
      require_description: task.require_description,
      min_description_length: task.min_description_length ?? 20,
      default_billable: task.default_billable ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingTask) {
      await updateMutation.mutateAsync({
        id: editingTask.id,
        data: { 
          name: formData.name.trim(), 
          description: formData.description.trim() || null,
          context: formData.context,
          default_value_type: formData.default_value_type,
          require_mandato: formData.require_mandato,
          require_lead: formData.require_lead,
          require_description: formData.require_description,
          min_description_length: formData.min_description_length,
          default_billable: formData.default_billable,
        }
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        context: formData.context,
        default_value_type: formData.default_value_type,
        require_mandato: formData.require_mandato,
        require_lead: formData.require_lead,
        require_description: formData.require_description,
        min_description_length: formData.min_description_length,
        default_billable: formData.default_billable,
      });
    }
    
    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingTask(null);
  };

  const handleToggleActive = async (task: WorkTaskType) => {
    await toggleMutation.mutateAsync({
      id: task.id,
      isActive: !task.is_active
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Helper to render rule badges
  const renderRuleBadges = (task: WorkTaskType) => {
    const badges = [];
    
    if (task.require_mandato) {
      badges.push(
        <Badge key="mandato" variant="outline" className="text-xs gap-1">
          <ClipboardList className="h-3 w-3" />
          Mandato
        </Badge>
      );
    }
    if (task.require_lead) {
      badges.push(
        <Badge key="lead" variant="outline" className="text-xs gap-1">
          <Users className="h-3 w-3" />
          Lead
        </Badge>
      );
    }
    if (task.require_description) {
      badges.push(
        <Badge key="desc" variant="outline" className="text-xs gap-1">
          <FileText className="h-3 w-3" />
          Desc({task.min_description_length ?? 20})
        </Badge>
      );
    }
    if (task.default_billable) {
      badges.push(
        <Badge key="billable" variant="outline" className="text-xs gap-1 text-green-600 border-green-600">
          <DollarSign className="h-3 w-3" />
          Facturable
        </Badge>
      );
    }
    
    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {badges}
      </div>
    ) : (
      <span className="text-muted-foreground text-sm">—</span>
    );
  };

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
                    <TableHead>Contexto</TableHead>
                    <TableHead>Tipo Valor</TableHead>
                    <TableHead>Reglas</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className={getContextBadgeStyles(task.context)}>
                          {CONTEXT_OPTIONS.find(o => o.value === task.context)?.label || task.context}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getValueTypeBadgeStyles(task.default_value_type || 'core_ma')}>
                          {VALUE_TYPE_OPTIONS.find(o => o.value === task.default_value_type)?.label || 'Core M&A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderRuleBadges(task)}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tipo de Tarea" : "Nuevo Tipo de Tarea"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic info */}
              <div className="space-y-4">
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
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Categorization */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Categorización</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-xs text-muted-foreground">Contexto</Label>
                    <Select
                      value={formData.context}
                      onValueChange={(value: WorkTaskTypeContext) => 
                        setFormData(prev => ({ ...prev, context: value }))
                      }
                    >
                      <SelectTrigger id="context">
                        <SelectValue placeholder="Seleccionar contexto" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTEXT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value_type" className="text-xs text-muted-foreground">Tipo de Valor</Label>
                    <Select
                      value={formData.default_value_type}
                      onValueChange={(value: TimeEntryValueType) => 
                        setFormData(prev => ({ ...prev, default_value_type: value }))
                      }
                    >
                      <SelectTrigger id="value_type">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALUE_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Validation rules */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Reglas de Validación</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="require_mandato"
                      checked={formData.require_mandato}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, require_mandato: checked === true }))
                      }
                    />
                    <label htmlFor="require_mandato" className="text-sm cursor-pointer">
                      Requiere seleccionar Mandato
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="require_lead"
                      checked={formData.require_lead}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, require_lead: checked === true }))
                      }
                    />
                    <label htmlFor="require_lead" className="text-sm cursor-pointer">
                      Requiere seleccionar Lead
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="require_description"
                        checked={formData.require_description}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, require_description: checked === true }))
                        }
                      />
                      <label htmlFor="require_description" className="text-sm cursor-pointer">
                        Requiere descripción
                      </label>
                    </div>
                    {formData.require_description && (
                      <div className="ml-7 flex items-center gap-2">
                        <Label htmlFor="min_length" className="text-xs text-muted-foreground whitespace-nowrap">
                          Longitud mínima:
                        </Label>
                        <Input
                          id="min_length"
                          type="number"
                          min={1}
                          max={500}
                          value={formData.min_description_length}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            min_description_length: parseInt(e.target.value) || 20 
                          }))}
                          className="w-20 h-8"
                        />
                        <span className="text-xs text-muted-foreground">caracteres</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Default values */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Valores por Defecto</Label>
                
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="default_billable"
                    checked={formData.default_billable}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, default_billable: checked === true }))
                    }
                  />
                  <label htmlFor="default_billable" className="text-sm cursor-pointer">
                    Facturable por defecto
                  </label>
                </div>
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
