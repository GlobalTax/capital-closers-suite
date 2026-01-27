import { useState, useEffect } from "react";
import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  Clock,
  Send,
  AlertCircle,
  Eye,
  MessageSquare,
  Check,
  X,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPlansForDate, updatePlanStatus, addAdminTask } from "@/services/dailyPlans.service";
import { DailyPlanItemRow } from "@/components/plans/DailyPlanItemRow";
import type { DailyPlanWithUser, DailyPlanItemPriority } from "@/types/dailyPlans";

export default function DailyPlansAdmin() {
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [plans, setPlans] = useState<DailyPlanWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  
  // Dialog states
  const [selectedPlan, setSelectedPlan] = useState<DailyPlanWithUser | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  
  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);
  const [newTaskPriority, setNewTaskPriority] = useState<DailyPlanItemPriority>('alta');
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, usersData] = await Promise.all([
        getPlansForDate(selectedDate),
        supabase.from('admin_users').select('user_id, full_name, email').eq('is_active', true)
      ]);
      
      setPlans(plansData);
      setAllUsers(usersData.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [selectedDate]);
  
  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleTomorrow = () => setSelectedDate(addDays(new Date(), 1));
  
  const isTomorrow = format(selectedDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  // Users without a plan
  const usersWithoutPlan = allUsers.filter(
    u => !plans.some(p => p.user_id === u.user_id)
  );
  
  const handleViewPlan = (plan: DailyPlanWithUser) => {
    setSelectedPlan(plan);
    setAdminNotes(plan.admin_notes || '');
    setShowDetailDialog(true);
  };
  
  const handleApprove = async (plan: DailyPlanWithUser) => {
    try {
      setSaving(true);
      await updatePlanStatus(plan.id, 'approved', adminNotes);
      toast.success('Plan aprobado');
      loadData();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error('Error al aprobar plan');
    } finally {
      setSaving(false);
    }
  };
  
  const handleReject = async (plan: DailyPlanWithUser) => {
    if (!adminNotes.trim()) {
      toast.error('Añade un comentario explicando el rechazo');
      return;
    }
    
    try {
      setSaving(true);
      await updatePlanStatus(plan.id, 'rejected', adminNotes);
      toast.success('Plan rechazado');
      loadData();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error('Error al rechazar plan');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddTask = async () => {
    if (!selectedPlan || !newTaskTitle.trim()) return;
    
    try {
      setSaving(true);
      await addAdminTask(selectedPlan.id, {
        title: newTaskTitle.trim(),
        estimated_minutes: newTaskMinutes,
        priority: newTaskPriority,
      });
      toast.success('Tarea añadida');
      loadData();
      setShowAddTaskDialog(false);
      setNewTaskTitle('');
      setNewTaskMinutes(60);
      setNewTaskPriority('alta');
    } catch (error) {
      toast.error('Error al añadir tarea');
    } finally {
      setSaving(false);
    }
  };
  
  const statusConfig = {
    draft: { label: 'Borrador', icon: AlertCircle, class: 'bg-yellow-500/10 text-yellow-600' },
    submitted: { label: 'Enviado', icon: Send, class: 'bg-blue-500/10 text-blue-600' },
    approved: { label: 'Aprobado', icon: CheckCircle2, class: 'bg-green-500/10 text-green-600' },
    rejected: { label: 'Rechazado', icon: X, class: 'bg-red-500/10 text-red-600' },
  };
  
  // Stats
  const totalPlans = plans.length;
  const submittedCount = plans.filter(p => p.status === 'submitted').length;
  const approvedCount = plans.filter(p => p.status === 'approved').length;
  const totalHours = plans.reduce((sum, p) => 
    sum + p.items.reduce((s, i) => s + i.estimated_minutes, 0), 0
  ) / 60;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planes del Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Revisa y gestiona los planes diarios del equipo
          </p>
        </div>
        
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={isTomorrow ? "default" : "outline"} 
            onClick={handleTomorrow}
            className="min-w-[180px]"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {format(selectedDate, "EEE d MMM", { locale: es })}
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{totalPlans}/{allUsers.length}</p>
                <p className="text-xs text-muted-foreground">planes creados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold">{submittedCount}</p>
                <p className="text-xs text-muted-foreground">pendientes de revisar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">planificadas total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Plans table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planes del día</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-center">Tareas</TableHead>
                  <TableHead className="text-center">Horas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const status = statusConfig[plan.status];
                  const StatusIcon = status.icon;
                  const planHours = plan.items.reduce((s, i) => s + i.estimated_minutes, 0) / 60;
                  
                  return (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.user_name || 'Usuario'}</p>
                          <p className="text-xs text-muted-foreground">{plan.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{plan.items.length}</TableCell>
                      <TableCell className="text-center font-mono">{planHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={status.class}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPlan(plan)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {plan.status === 'submitted' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleApprove(plan)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Users without plans */}
                {usersWithoutPlan.map((user) => (
                  <TableRow key={user.user_id} className="bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="font-medium text-muted-foreground">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                        Sin plan
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Recordar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Plan Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Plan de {selectedPlan?.user_name || 'Usuario'}
            </DialogTitle>
            <DialogDescription>
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4 py-4">
              {/* Tasks list */}
              <div className="space-y-2">
                <Label>Tareas planificadas</Label>
                {selectedPlan.items.map((item) => (
                  <DailyPlanItemRow
                    key={item.id}
                    item={item}
                    canEdit={false}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
              
              {/* Add task button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowDetailDialog(false);
                  setShowAddTaskDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir tarea al plan
              </Button>
              
              {/* User notes */}
              {selectedPlan.user_notes && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <Label className="text-xs">Notas del usuario</Label>
                  <p className="text-sm mt-1">{selectedPlan.user_notes}</p>
                </div>
              )}
              
              {/* Admin notes */}
              <div className="space-y-2">
                <Label>Comentarios del admin</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Añade comentarios o feedback..."
                  rows={3}
                />
              </div>
              
              {/* Actions */}
              {selectedPlan.status === 'submitted' && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleReject(selectedPlan)}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedPlan)}
                    disabled={saving}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Task Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir tarea al plan</DialogTitle>
            <DialogDescription>
              Esta tarea se marcará como asignada por admin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título de la tarea</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ej: Revisar contrato Mandato X"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo estimado (min)</Label>
                <Input
                  type="number"
                  value={newTaskMinutes}
                  onChange={(e) => setNewTaskMinutes(parseInt(e.target.value) || 0)}
                  min={15}
                  step={15}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as DailyPlanItemPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask} disabled={saving || !newTaskTitle.trim()}>
              Añadir tarea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
