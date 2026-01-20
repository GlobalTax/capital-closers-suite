import { Plus, Trash2, BarChart3, PieChart, LineChart, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'donut';
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  showLegend?: boolean;
}

interface ChartEditorProps {
  chart: ChartData | undefined;
  onUpdate: (chart: ChartData) => void;
}

const CHART_TYPES: { value: ChartData['type']; label: string; icon: React.ElementType }[] = [
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'pie', label: 'Pie', icon: PieChart },
  { value: 'line', label: 'Línea', icon: LineChart },
  { value: 'donut', label: 'Donut', icon: Circle },
];

const DEFAULT_COLORS = [
  '#1e3a5f', '#2563eb', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'
];

const DEFAULT_CHART: ChartData = {
  type: 'bar',
  data: [
    { label: 'FY22', value: 35, color: DEFAULT_COLORS[0] },
    { label: 'FY23', value: 42, color: DEFAULT_COLORS[1] },
    { label: 'FY24', value: 52, color: DEFAULT_COLORS[2] },
    { label: 'FY25E', value: 65, color: DEFAULT_COLORS[3] },
  ],
  title: 'Revenue Evolution (€M)',
  showLegend: true,
};

export function ChartEditor({ chart, onUpdate }: ChartEditorProps) {
  const data = chart || DEFAULT_CHART;
  
  const updateType = (type: ChartData['type']) => {
    onUpdate({ ...data, type });
  };
  
  const updateDataPoint = (index: number, field: keyof ChartData['data'][0], value: string | number) => {
    const newData = [...data.data];
    newData[index] = { ...newData[index], [field]: field === 'value' ? Number(value) : value };
    onUpdate({ ...data, data: newData });
  };
  
  const addDataPoint = () => {
    const newData = [...data.data, { 
      label: `Item ${data.data.length + 1}`, 
      value: 0,
      color: DEFAULT_COLORS[data.data.length % DEFAULT_COLORS.length]
    }];
    onUpdate({ ...data, data: newData });
  };
  
  const removeDataPoint = (index: number) => {
    if (data.data.length <= 2) return;
    const newData = data.data.filter((_, i) => i !== index);
    onUpdate({ ...data, data: newData });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Gráfico</Label>
        <Button variant="ghost" size="sm" onClick={addDataPoint}>
          <Plus className="h-4 w-4 mr-1" />
          Dato
        </Button>
      </div>
      
      {/* Chart type selector */}
      <div className="grid grid-cols-4 gap-2">
        {CHART_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => updateType(value)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
              "hover:bg-accent/50",
              data.type === value 
                ? "border-primary bg-primary/5" 
                : "border-border bg-background"
            )}
          >
            <Icon className={cn(
              "h-4 w-4",
              data.type === value ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs",
              data.type === value ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Title */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Título del gráfico</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => onUpdate({ ...data, title: e.target.value })}
          placeholder="Título del gráfico"
        />
      </div>
      
      {/* Data points */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Datos</Label>
        {data.data.map((point, i) => (
          <div key={i} className="flex gap-2 items-center group">
            <Input
              type="color"
              value={point.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              onChange={(e) => updateDataPoint(i, 'color', e.target.value)}
              className="w-10 h-8 p-1"
            />
            <Input
              value={point.label}
              onChange={(e) => updateDataPoint(i, 'label', e.target.value)}
              placeholder="Etiqueta"
              className="flex-1"
            />
            <Input
              type="number"
              value={point.value}
              onChange={(e) => updateDataPoint(i, 'value', e.target.value)}
              placeholder="Valor"
              className="w-24"
            />
            {data.data.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => removeDataPoint(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {/* Options */}
      <div className="flex items-center gap-2">
        <Switch
          checked={data.showLegend ?? true}
          onCheckedChange={(checked) => onUpdate({ ...data, showLegend: checked })}
        />
        <Label className="text-sm">Mostrar leyenda</Label>
      </div>
    </div>
  );
}

export default ChartEditor;
