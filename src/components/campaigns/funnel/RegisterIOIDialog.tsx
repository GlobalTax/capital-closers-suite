// ============================================
// REGISTER IOI DIALOG
// Modal to register indicative offers
// ============================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Loader2 } from 'lucide-react';
import { type CandidateWithFunnelStage } from '@/types/candidateFunnel';

interface RegisterIOIDialogProps {
  recipient: CandidateWithFunnelStage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (recipientId: string, amount: number, notes?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function RegisterIOIDialog({
  recipient,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: RegisterIOIDialogProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    
    if (!recipient) return;
    
    try {
      await onSubmit(recipient.id, numAmount, notes || undefined);
      setAmount('');
      setNotes('');
      onOpenChange(false);
    } catch (err) {
      setError('Error al registrar IOI');
    }
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    setError('');
    onOpenChange(false);
  };

  // Format amount as currency while typing
  const handleAmountChange = (value: string) => {
    // Remove non-numeric except dots
    const cleaned = value.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const formattedDisplay = amount 
    ? `€ ${parseFloat(amount).toLocaleString('es-ES', { minimumFractionDigits: 0 })}`
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-pink-600" />
            Registrar IOI
          </DialogTitle>
          <DialogDescription>
            {recipient && (
              <>
                Registrar oferta indicativa de{' '}
                <strong>{recipient.nombre || recipient.email}</strong>
                {recipient.empresa_nombre && (
                  <> ({recipient.empresa_nombre})</>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto de la oferta indicativa</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="2,500,000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
            {amount && parseFloat(amount) >= 1000000 && (
              <p className="text-xs text-muted-foreground">
                ≈ €{(parseFloat(amount) / 1000000).toFixed(2)}M
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Condiciones, plazos, comentarios..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar IOI'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
