import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProcessStep {
  number: number;
  title: string;
  description?: string;
}

interface ProcessEditorProps {
  process: ProcessStep[] | undefined;
  onUpdate: (process: ProcessStep[]) => void;
}

const DEFAULT_PROCESS: ProcessStep[] = [
  { number: 1, title: 'Initial Assessment', description: 'Strategic review and valuation analysis' },
  { number: 2, title: 'Market Outreach', description: 'Targeted buyer identification and approach' },
  { number: 3, title: 'Due Diligence', description: 'Comprehensive information exchange' },
  { number: 4, title: 'Negotiation & Close', description: 'Deal structuring and execution' },
];

export function ProcessEditor({ process, onUpdate }: ProcessEditorProps) {
  const data = process || DEFAULT_PROCESS;
  
  const updateStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    const newSteps = [...data];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onUpdate(newSteps);
  };
  
  const addStep = () => {
    const newSteps = [...data, { 
      number: data.length + 1, 
      title: '', 
      description: '' 
    }];
    onUpdate(newSteps);
  };
  
  const removeStep = (index: number) => {
    if (data.length <= 2) return;
    const newSteps = data.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      number: i + 1,
    }));
    onUpdate(newSteps);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Proceso / Fases</Label>
        <Button variant="ghost" size="sm" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1" />
          Paso
        </Button>
      </div>
      
      <div className="space-y-2">
        {data.map((step, i) => (
          <div key={i} className="flex gap-2 items-start p-3 border rounded-lg group">
            <div className="flex items-center gap-2 pt-1">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {step.number}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={step.title}
                onChange={(e) => updateStep(i, 'title', e.target.value)}
                placeholder="Título del paso"
                className="font-medium"
              />
              <Input
                value={step.description || ''}
                onChange={(e) => updateStep(i, 'description', e.target.value)}
                placeholder="Descripción (opcional)"
                className="text-sm"
              />
            </div>
            {data.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 mt-1"
                onClick={() => removeStep(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProcessEditor;
