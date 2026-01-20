import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface IconItem {
  name: string;
  label: string;
  description?: string;
}

interface IconPickerProps {
  icons: IconItem[] | undefined;
  onUpdate: (icons: IconItem[]) => void;
}

// Common business icons
const RECOMMENDED_ICONS = [
  'TrendingUp', 'BarChart3', 'PieChart', 'LineChart',
  'Users', 'Building2', 'Briefcase', 'Target',
  'Globe', 'MapPin', 'Phone', 'Mail',
  'Shield', 'Lock', 'CheckCircle', 'Award',
  'Lightbulb', 'Zap', 'Rocket', 'Settings',
  'Handshake', 'FileText', 'Folder', 'Database',
  'Clock', 'Calendar', 'DollarSign', 'Euro',
  'ArrowUpRight', 'ArrowDownRight', 'RefreshCw', 'Layers',
];

const DEFAULT_ICONS: IconItem[] = [
  { name: 'Target', label: 'M&A Advisory', description: 'Full-service sell-side and buy-side mandates' },
  { name: 'BarChart3', label: 'Valuation', description: 'Fair market value assessments' },
  { name: 'Shield', label: 'Due Diligence', description: 'Commercial and financial analysis' },
  { name: 'Handshake', label: 'Negotiation', description: 'Deal structuring and closing support' },
];

export function IconPicker({ icons, onUpdate }: IconPickerProps) {
  const data = icons || DEFAULT_ICONS;
  const [searchTerm, setSearchTerm] = useState('');
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  
  const filteredIcons = RECOMMENDED_ICONS.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const updateIcon = (index: number, field: keyof IconItem, value: string) => {
    const newIcons = [...data];
    newIcons[index] = { ...newIcons[index], [field]: value };
    onUpdate(newIcons);
  };
  
  const selectIcon = (index: number, iconName: string) => {
    updateIcon(index, 'name', iconName);
    setOpenPickerIndex(null);
  };
  
  const addIcon = () => {
    const newIcons = [...data, { name: 'Star', label: '', description: '' }];
    onUpdate(newIcons);
  };
  
  const removeIcon = (index: number) => {
    if (data.length <= 1) return;
    const newIcons = data.filter((_, i) => i !== index);
    onUpdate(newIcons);
  };
  
  const renderIcon = (name: string, className?: string) => {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
    return Icon ? <Icon className={className} /> : null;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Iconos y servicios</Label>
        <Button variant="ghost" size="sm" onClick={addIcon}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>
      
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2 group">
            <div className="flex gap-2 items-center">
              {/* Icon selector */}
              <Popover 
                open={openPickerIndex === i} 
                onOpenChange={(open) => setOpenPickerIndex(open ? i : null)}
              >
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 shrink-0"
                  >
                    {renderIcon(item.name, "h-5 w-5")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar icono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <ScrollArea className="h-48">
                      <div className="grid grid-cols-6 gap-1">
                        {filteredIcons.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => selectIcon(i, iconName)}
                            className={cn(
                              "p-2 rounded hover:bg-accent",
                              item.name === iconName && "bg-primary/10"
                            )}
                            title={iconName}
                          >
                            {renderIcon(iconName, "h-4 w-4")}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Input
                value={item.label}
                onChange={(e) => updateIcon(i, 'label', e.target.value)}
                placeholder="Título"
                className="flex-1"
              />
              
              {data.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => removeIcon(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Input
              value={item.description || ''}
              onChange={(e) => updateIcon(i, 'description', e.target.value)}
              placeholder="Descripción (opcional)"
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default IconPicker;
