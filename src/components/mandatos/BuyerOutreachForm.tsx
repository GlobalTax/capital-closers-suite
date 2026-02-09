import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateBuyerOutreach } from "@/hooks/useBuyerOutreach";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  buyerId: string;
  mandatoId: string;
  defaultType?: string;
}

export function BuyerOutreachForm({ open, onOpenChange, matchId, buyerId, mandatoId, defaultType = "contacto" }: Props) {
  const createMutation = useCreateBuyerOutreach();
  const [channel, setChannel] = useState("email");
  const [outreachType, setOutreachType] = useState(defaultType);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    createMutation.mutate(
      {
        match_id: matchId,
        buyer_id: buyerId,
        mandato_id: mandatoId,
        channel,
        outreach_type: outreachType,
        subject: subject || undefined,
        notes: notes || undefined,
        status: "sent",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSubject("");
          setNotes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Outreach</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={outreachType} onValueChange={setOutreachType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacto">Contacto</SelectItem>
                  <SelectItem value="teaser">Teaser</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="followup">Seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Asunto (opcional)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Asunto del mensaje..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Notas (opcional)</Label>
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder="Notas internas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
