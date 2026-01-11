import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTVDashboardConfig, type TVColumnConfig } from "@/hooks/useTVDashboardConfig";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Plus, Eye, Save } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useNavigate } from "react-router-dom";

const AVAILABLE_COLORS = [
  { value: 'slate', label: 'Slate', preview: 'bg-slate-200' },
  { value: 'zinc', label: 'Zinc', preview: 'bg-zinc-200' },
  { value: 'neutral', label: 'Neutral', preview: 'bg-neutral-200' },
  { value: 'stone', label: 'Stone', preview: 'bg-stone-200' },
  { value: 'gray', label: 'Gray', preview: 'bg-gray-200' },
  { value: 'emerald', label: 'Emerald', preview: 'bg-emerald-200' }
] as const;

const COMMON_ICONS = [
  'Inbox', 'Phone', 'CheckCircle', 'Briefcase', 'Handshake', 'Trophy',
  'Target', 'Users', 'Building', 'FileText', 'Clock', 'Star'
];

function SortableColumn({ column, onEdit, onToggle }: { 
  column: TVColumnConfig; 
  onEdit: (col: TVColumnConfig) => void;
  onToggle: (id: string, activo: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });
  const Icon = (LucideIcons as any)[column.icono] || LucideIcons.Circle;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className={`p-2 rounded-lg ${AVAILABLE_COLORS.find(c => c.value === column.color)?.preview}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{column.columna_tv}</p>
        <p className="text-sm text-muted-foreground">
          {column.fase_tipo === 'lead' ? 'Lead' : 'Mandato'} - {column.fase_id}
        </p>
      </div>

      <Switch 
        checked={column.activo} 
        onCheckedChange={(checked) => onToggle(column.id, checked)}
      />
      
      <Button variant="outline" size="icon" onClick={() => onEdit(column)}>
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );
}

function EditColumnDialog({ 
  column, 
  open, 
  onOpenChange, 
  onSave 
}: { 
  column: TVColumnConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<TVColumnConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<TVColumnConfig>>(column || {});

  if (!column) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Columna</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Nombre de la Columna</Label>
            <Input 
              value={formData.columna_tv || ''} 
              onChange={(e) => setFormData({ ...formData, columna_tv: e.target.value })}
            />
          </div>

          <div>
            <Label>Color</Label>
            <Select 
              value={formData.color} 
              onValueChange={(value: any) => setFormData({ ...formData, color: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_COLORS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${c.preview}`} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Icono</Label>
            <Select 
              value={formData.icono} 
              onValueChange={(value) => setFormData({ ...formData, icono: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_ICONS.map(iconName => {
                  const Icon = (LucideIcons as any)[iconName];
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {iconName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => {
              onSave(formData);
              onOpenChange(false);
            }}
            className="w-full"
          >
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ConfigurarDashboardTV() {
  const navigate = useNavigate();
  const { columns, updateColumn, reorderColumns, toggleColumn } = useTVDashboardConfig();
  const [localColumns, setLocalColumns] = useState<TVColumnConfig[]>(columns);
  const [editingColumn, setEditingColumn] = useState<TVColumnConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = () => {
    const reordered = localColumns.map((col, idx) => ({
      id: col.id,
      orden: idx + 1
    }));
    reorderColumns.mutate(reordered);
  };

  const handleEdit = (column: TVColumnConfig) => {
    setEditingColumn(column);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updates: Partial<TVColumnConfig>) => {
    if (editingColumn) {
      updateColumn.mutate({ id: editingColumn.id, updates });
    }
  };

  const handleToggle = (id: string, activo: boolean) => {
    toggleColumn.mutate({ id, activo });
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6">
        <PageHeader
          title="Configurar Dashboard TV"
          subtitle="Personaliza las columnas, colores e iconos del dashboard"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard-tv')}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Dashboard
              </Button>
              <Button onClick={handleSaveOrder}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Orden
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Columnas del Dashboard</h2>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={localColumns.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {localColumns.map(col => (
                    <SortableColumn 
                      key={col.id} 
                      column={col} 
                      onEdit={handleEdit}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Vista Previa</h2>
            <div className="bg-muted/50 p-4 rounded-lg min-h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Arrastra las columnas para reordenar. Los cambios se aplicarán al dashboard.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <EditColumnDialog 
        column={editingColumn}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </AppLayout>
  );
}
