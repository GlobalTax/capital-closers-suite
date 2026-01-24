import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateLeadQuickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onLeadCreated: (leadId: string, leadData: { id: string; company_name: string; contact_name: string | null; contact_email: string | null }) => void;
}

export function CreateLeadQuickDialog({
  open,
  onOpenChange,
  mandatoId,
  onLeadCreated,
}: CreateLeadQuickDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la empresa es requerido',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('mandate_leads')
        .insert({
          mandato_id: mandatoId,
          company_name: companyName.trim(),
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
          stage: 'nuevo',
          lead_type: 'contact',
        })
        .select('id, company_name, contact_name, contact_email')
        .single();

      if (error) throw error;

      toast({
        title: 'Lead creado',
        description: `${data.company_name} añadido correctamente`,
      });

      onLeadCreated(data.id, data);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el lead',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setContactName('');
    setContactEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nuevo Lead
          </DialogTitle>
          <DialogDescription>
            Crea un lead rápido asociado a este mandato
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Empresa *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nombre de la empresa"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactName">Contacto</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre del contacto (opcional)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@empresa.com (opcional)"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
