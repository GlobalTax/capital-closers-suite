import { useState } from 'react';
import { format } from 'date-fns';
import { Mail, Linkedin, Phone, MessageSquare, Send, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCreateOutreach } from '@/hooks/useOutreach';
import type { SearchFund } from '@/types/searchFunds';
import type { OutreachChannel } from '@/services/outreach.service';

interface AssociatedMandato {
  id: string;
  codigo: string;
}

interface OutreachDrawerProps {
  fund: SearchFund;
  associatedMandatos?: AssociatedMandato[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CHANNEL_OPTIONS: { value: OutreachChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
  { value: 'phone', label: 'Llamada', icon: <Phone className="w-4 h-4" /> },
  { value: 'other', label: 'Otro', icon: <MessageSquare className="w-4 h-4" /> },
];

export function OutreachDrawer({
  fund,
  associatedMandatos = [],
  open,
  onOpenChange,
  onSuccess,
}: OutreachDrawerProps) {
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [selectedMandato, setSelectedMandato] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [messagePreview, setMessagePreview] = useState('');
  const [markAsSent, setMarkAsSent] = useState(true);
  const [notes, setNotes] = useState('');

  const createOutreach = useCreateOutreach();

  const handleSubmit = () => {
    createOutreach.mutate(
      {
        fund_id: fund.id,
        mandato_id: selectedMandato || undefined,
        channel,
        subject: subject || undefined,
        message_preview: messagePreview || undefined,
        sent_at: markAsSent ? new Date().toISOString() : undefined,
        status: markAsSent ? 'sent' : 'draft',
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setChannel('email');
          setSelectedMandato('');
          setSubject('');
          setMessagePreview('');
          setMarkAsSent(true);
          setNotes('');
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Registrar Outreach
          </SheetTitle>
          <SheetDescription>
            Fondo: <span className="font-medium text-foreground">{fund.name}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Mandato Selector */}
          {associatedMandatos.length > 0 && (
            <div className="space-y-2">
              <Label>Mandato asociado (opcional)</Label>
              <Select value={selectedMandato || "none"} onValueChange={(v) => setSelectedMandato(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mandato..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin mandato</SelectItem>
                  {associatedMandatos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Channel Selector */}
          <div className="space-y-2">
            <Label>Canal</Label>
            <ToggleGroup
              type="single"
              value={channel}
              onValueChange={(value) => value && setChannel(value as OutreachChannel)}
              className="justify-start"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  aria-label={opt.label}
                  className="gap-1.5"
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Introducción - Oportunidad Sector Tech"
            />
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (preview)</Label>
            <Textarea
              id="message"
              value={messagePreview}
              onChange={(e) => setMessagePreview(e.target.value)}
              placeholder="Resumen del contenido del mensaje..."
              rows={5}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas privadas sobre este outreach..."
              rows={2}
            />
          </div>

          {/* Mark as Sent */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="markSent"
              checked={markAsSent}
              onCheckedChange={(checked) => setMarkAsSent(checked === true)}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="markSent" className="cursor-pointer">
                Marcar como enviado
              </Label>
              {markAsSent && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(), 'dd/MM/yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createOutreach.isPending}>
            {createOutreach.isPending ? 'Registrando...' : 'Registrar Outreach'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
