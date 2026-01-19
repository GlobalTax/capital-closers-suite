import { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimerStore, formatTime } from '@/stores/useTimerStore';
import { cn } from '@/lib/utils';

export function GlobalTimer() {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, getElapsedSeconds } = useTimerStore();
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
  
  // Idle state - show start button
  if (timerState === 'idle') {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 h-8"
        onClick={startTimer}
      >
        <Play className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Iniciar</span>
      </Button>
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
