import { useState, useEffect } from 'react';
import { Play, Pause, Square, ChevronDown, Users, FileText, Handshake, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTimerStore, formatTime, TimeEntryValueType } from '@/stores/useTimerStore';
import { useAllWorkTaskTypes } from '@/hooks/useWorkTaskTypes';
import { cn } from '@/lib/utils';

// Quick actions configuration
const QUICK_ACTIONS = [
  {
    id: 'compradores',
    label: 'Compradores/Vendedores',
    icon: Users,
    workTaskTypeName: 'Potenciales Compradores / Vendedores',
    valueType: 'core_ma' as TimeEntryValueType,
  },
  {
    id: 'datapack',
    label: 'Datapack',
    icon: FileText,
    workTaskTypeName: 'Datapack',
    valueType: 'core_ma' as TimeEntryValueType,
  },
  {
    id: 'reunion',
    label: 'Reunión',
    icon: Handshake,
    workTaskTypeName: 'Reunión / Puesta en Contacto',
    valueType: 'core_ma' as TimeEntryValueType,
  },
  {
    id: 'interno',
    label: 'Trabajo interno',
    icon: Building2,
    workTaskTypeName: 'Material Interno',
    valueType: 'soporte' as TimeEntryValueType,
  },
];

export function GlobalTimer() {
  const { 
    timerState, 
    startTimer, 
    startTimerWithPreset,
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    getElapsedSeconds,
    presetWorkTaskTypeName 
  } = useTimerStore();
  const { data: workTaskTypes } = useAllWorkTaskTypes();
  const [displayTime, setDisplayTime] = useState('00:00:00');
  
  // Update display every second when running
  useEffect(() => {
    if (timerState !== 'running') {
      setDisplayTime(formatTime(getElapsedSeconds()));
      return;
    }
    
    const interval = setInterval(() => {
      setDisplayTime(formatTime(getElapsedSeconds()));
    }, 1000);
    
    // Initial update
    setDisplayTime(formatTime(getElapsedSeconds()));
    
    return () => clearInterval(interval);
  }, [timerState, getElapsedSeconds]);
  
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    // Find the work task type ID by name
    const workTaskType = workTaskTypes?.find(t => t.name === action.workTaskTypeName);
    
    startTimerWithPreset({
      workTaskTypeId: workTaskType?.id || '',
      workTaskTypeName: action.workTaskTypeName,
      valueType: action.valueType,
    });
  };
  
  // Idle state - show dropdown with quick actions
  if (timerState === 'idle') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Iniciar</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {/* Normal start */}
          <DropdownMenuItem onClick={startTimer} className="gap-2">
            <Play className="h-4 w-4" />
            Iniciar trabajo
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            ⚡ Acciones Rápidas
          </DropdownMenuLabel>
          
          {/* Quick actions */}
          {QUICK_ACTIONS.map((action) => (
            <DropdownMenuItem 
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="gap-2"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{action.label}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5",
                  action.valueType === 'core_ma' 
                    ? "border-emerald-500/30 text-emerald-600" 
                    : "border-amber-500/30 text-amber-600"
                )}
              >
                {action.valueType === 'core_ma' ? 'CORE' : 'SOPORTE'}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Running or Paused state
  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
        timerState === 'running' 
          ? "bg-emerald-500/10 border-emerald-500/20" 
          : "bg-amber-500/10 border-amber-500/20"
      )}
    >
      {/* Status indicator */}
      {timerState === 'running' ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      )}
      
      {/* Time display */}
      <span className="font-mono text-sm font-medium tabular-nums min-w-[64px]">
        {displayTime}
      </span>
      
      {/* Preset indicator (compact) */}
      {presetWorkTaskTypeName && (
        <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[100px]" title={presetWorkTaskTypeName}>
          {presetWorkTaskTypeName.split(' ')[0]}
        </span>
      )}
      
      {/* Controls */}
      <div className="flex items-center gap-1">
        {timerState === 'running' ? (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-amber-500/10"
            onClick={pauseTimer}
            title="Pausar"
          >
            <Pause className="h-3 w-3" />
          </Button>
        ) : (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-emerald-500/10"
            onClick={resumeTimer}
            title="Reanudar"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
        
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 hover:bg-destructive/10 text-destructive"
          onClick={stopTimer}
          title="Detener y registrar"
        >
          <Square className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
