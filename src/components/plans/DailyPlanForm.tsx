import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Send, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { DailyPlanItemRow } from "./DailyPlanItemRow";
import { MandatoSelect } from "@/components/shared/MandatoSelect";
import type { DailyPlanWithItems, NewDailyPlanItem, DailyPlanItemPriority } from "@/types/dailyPlans";

interface DailyPlanFormProps {
  plan: DailyPlanWithItems;
  targetDate: Date;
  loading?: boolean;
  saving?: boolean;
  canEdit: boolean;
  onAddItem: (item: NewDailyPlanItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<NewDailyPlanItem & { completed?: boolean }>) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onSubmit: () => void;
}

export function DailyPlanForm({
  plan,
  targetDate,
  loading,
  saving,
  canEdit,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateNotes,
  onSubmit,
}: DailyPlanFormProps) {
  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(60);
  const [newPriority, setNewPriority] = useState<DailyPlanItemPriority>('media');
  const [newMandatoId, setNewMandatoId] = useState('');
  const [notes, setNotes] = useState(plan.user_notes || '');
  const [mandatoNames, setMandatoNames] = useState<Record<string, string>>({});
  
  // Load mandato names for display
  useEffect(() => {
    const mandatoIds = [...new Set(plan.items.map(i => i.mandato_id).filter(Boolean))];
    if (mandatoIds.length === 0) return;
    
    supabase
      .from('mandatos')
      .select('id, descripcion, tipo')
      .in('id', mandatoIds as string[])
      .then(({ data }) => {
        if (data) {
          const names: Record<string, string> = {};
          data.forEach(m => {
            names[m.id] = m.descripcion || `Mandato ${m.tipo}`;
          });
          setMandatoNames(names);
        }
      });
  }, [plan.items]);
  
  const handleAddItem = () => {
    if (!newTitle.trim()) return;
    
    onAddItem({
      title: newTitle.trim(),
      estimated_minutes: newMinutes,
      priority: newPriority,
      mandato_id: newMandatoId || null,
    });
    
    // Reset form
    setNewTitle('');
    setNewMinutes(60);
    setNewPriority('media');
    setNewMandatoId('');
  };
  
  const handleNotesBlur = () => {
    if (notes !== plan.user_notes) {
      onUpdateNotes(notes);
    }
  };
  
  const totalMinutes = plan.items.reduce((sum, item) => sum + item.estimated_minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedItems = plan.items.filter(i => i.completed).length;
  
  const statusConfig = {
    draft: { label: 'Borrador', icon: AlertCircle, class: 'bg-yellow-500/10 text-yellow-600' },
    submitted: { label: 'Enviado', icon: Send, class: 'bg-blue-500/10 text-blue-600' },
    approved: { label: 'Aprobado', icon: CheckCircle2, class: 'bg-green-500/10 text-green-600' },
    rejected: { label: 'Rechazado', icon: AlertCircle, class: 'bg-red-500/10 text-red-600' },
  };
  
  const status = statusConfig[plan.status];
  const StatusIcon = status.icon;
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Plan para: {format(targetDate, "EEEE d 'de' MMMM", { locale: es })}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Planifica las tareas que realizarás mañana
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={status.class}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {status.label}
            </Badge>
            {plan.modified_after_submit && plan.status !== 'draft' && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                Modificado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add new item form */}
        {canEdit && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <Label className="text-sm font-medium">Añadir tarea</Label>
            <div className="flex flex-wrap gap-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título de la tarea..."
                className="flex-1 min-w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    handleAddItem();
                  }
                }}
              />
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(parseInt(e.target.value) || 0)}
                  className="w-20"
                  min={15}
                  step={15}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as DailyPlanItemPriority)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="min-w-[180px]">
                <MandatoSelect
                  value={newMandatoId}
                  onValueChange={setNewMandatoId}
                  includeGeneralWork={true}
                  placeholder="Mandato (opcional)"
                />
              </div>
              
              <Button onClick={handleAddItem} disabled={!newTitle.trim() || saving}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>
        )}
        
        {/* Tasks list */}
        <div className="space-y-2">
          {plan.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay tareas planificadas</p>
              <p className="text-sm">Añade las tareas que realizarás mañana</p>
            </div>
          ) : (
            plan.items.map((item) => (
              <DailyPlanItemRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                mandatoName={item.mandato_id ? mandatoNames[item.mandato_id] : undefined}
                onUpdate={(updates) => onUpdateItem(item.id, updates)}
                onDelete={() => onDeleteItem(item.id)}
              />
            ))
          )}
        </div>
        
        {/* Summary */}
        {plan.items.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {plan.items.length} {plan.items.length === 1 ? 'tarea' : 'tareas'}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{totalHours}h planificadas</span>
                {completedItems > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-green-600">{completedItems} completadas</span>
                  </>
                )}
              </div>
            </div>
            {/* Warning when below minimum hours */}
            {parseFloat(totalHours) < 8 && (
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Faltan {(8 - parseFloat(totalHours)).toFixed(1)}h para el mínimo de 8h
              </p>
            )}
          </>
        )}
        
        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm">Notas (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Notas adicionales sobre tu plan..."
            rows={2}
            disabled={!canEdit}
          />
        </div>
        
        {/* Admin notes (read-only) */}
        {plan.admin_notes && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <Label className="text-xs text-muted-foreground">Comentarios del admin</Label>
            <p className="text-sm">{plan.admin_notes}</p>
          </div>
        )}
        
        {/* Submit button */}
        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button 
              onClick={onSubmit} 
              disabled={saving || plan.items.length === 0 || parseFloat(totalHours) < 8}
              className="min-w-[140px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {plan.status === 'draft' ? 'Enviar Plan' : 'Re-enviar Plan'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
