import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuoteData {
  text: string;
  author?: string;
  role?: string;
  company?: string;
}

interface QuoteEditorProps {
  quote: QuoteData | undefined;
  onUpdate: (quote: QuoteData) => void;
}

const DEFAULT_QUOTE: QuoteData = {
  text: "This acquisition represents a strategic milestone in our expansion strategy, combining complementary capabilities to deliver enhanced value to our clients.",
  author: "John Smith",
  role: "CEO",
  company: "Acquiring Company",
};

export function QuoteEditor({ quote, onUpdate }: QuoteEditorProps) {
  const data = quote || DEFAULT_QUOTE;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cita</Label>
        <Textarea
          value={data.text}
          onChange={(e) => onUpdate({ ...data, text: e.target.value })}
          placeholder="Texto de la cita..."
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Autor</Label>
          <Input
            value={data.author || ''}
            onChange={(e) => onUpdate({ ...data, author: e.target.value })}
            placeholder="Nombre"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cargo</Label>
          <Input
            value={data.role || ''}
            onChange={(e) => onUpdate({ ...data, role: e.target.value })}
            placeholder="CEO"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Empresa</Label>
          <Input
            value={data.company || ''}
            onChange={(e) => onUpdate({ ...data, company: e.target.value })}
            placeholder="Company"
          />
        </div>
      </div>
    </div>
  );
}

export default QuoteEditor;
