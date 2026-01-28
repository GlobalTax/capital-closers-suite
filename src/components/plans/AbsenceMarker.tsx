import { useState } from "react";
import { Palmtree, ThermometerSun, User, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type AbsenceType } from "@/services/absences.service";

interface AbsenceMarkerProps {
  date: Date;
  canEdit: boolean;
  onMarkAbsence: (data: { date: Date; type: AbsenceType; notes?: string }) => void;
  isLoading?: boolean;
}

const absenceOptions: { type: AbsenceType; label: string; emoji: string; icon: typeof Palmtree }[] = [
  { type: 'vacation', label: 'Vacaciones', emoji: '🏖️', icon: Palmtree },
  { type: 'sick_leave', label: 'Baja médica', emoji: '🤒', icon: ThermometerSun },
  { type: 'personal', label: 'Asunto personal', emoji: '👤', icon: User },
  { type: 'other', label: 'Otra ausencia', emoji: '📅', icon: Calendar },
];

export function AbsenceMarker({ date, canEdit, onMarkAbsence, isLoading }: AbsenceMarkerProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AbsenceType | null>(null);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!selectedType) return;
    onMarkAbsence({ date, type: selectedType, notes: notes.trim() || undefined });
    setOpen(false);
    setSelectedType(null);
    setNotes('');
  };

  if (!canEdit) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          ¿No trabajarás este día?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Marca el día como ausencia para no requerir planificación ni registro de horas.
        </p>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="flex flex-wrap gap-2">
              {absenceOptions.map((option) => (
                <Button
                  key={option.type}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType(option.type);
                    setOpen(true);
                  }}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <span>{option.emoji}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Marcar ausencia
              </DialogTitle>
              <DialogDescription>
                {selectedType && (
                  <span className="text-base">
                    {absenceOptions.find(o => o.type === selectedType)?.emoji}{' '}
                    {absenceOptions.find(o => o.type === selectedType)?.label}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Añade cualquier detalle relevante..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} disabled={!selectedType || isLoading}>
                  Confirmar ausencia
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
