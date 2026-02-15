import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerState = 'idle' | 'running' | 'paused';
export type TimeEntryValueType = 'core_ma' | 'soporte' | 'bajo_valor';

interface TimerStore {
  // Timer state
  timerState: TimerState;
  startedAt: string | null; // ISO string for serialization
  pausedAt: string | null;
  accumulatedSeconds: number;
  
  // Presets from quick actions
  presetWorkTaskTypeId: string | null;
  presetWorkTaskTypeName: string | null;
  presetValueType: TimeEntryValueType | null;
  
  // Actions
  startTimer: () => void;
  startTimerWithPreset: (preset: {
    workTaskTypeId: string;
    workTaskTypeName: string;
    valueType: TimeEntryValueType;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => number; // Returns total seconds
  resetTimer: () => void;
  clearPresets: () => void;
  
  // Assignment modal
  isAssignmentModalOpen: boolean;
  pendingTimeSeconds: number;
  openAssignmentModal: (seconds: number) => void;
  closeAssignmentModal: () => void;
  
  // Computed
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      timerState: 'idle',
      startedAt: null,
      pausedAt: null,
      accumulatedSeconds: 0,
      isAssignmentModalOpen: false,
      pendingTimeSeconds: 0,
      
      // Presets
      presetWorkTaskTypeId: null,
      presetWorkTaskTypeName: null,
      presetValueType: null,
      
      startTimer: () => {
        set({
          timerState: 'running',
          startedAt: new Date().toISOString(),
          pausedAt: null,
          accumulatedSeconds: 0,
          presetWorkTaskTypeId: null,
          presetWorkTaskTypeName: null,
          presetValueType: null,
        });
      },
      
      startTimerWithPreset: (preset) => {
        set({
          timerState: 'running',
          startedAt: new Date().toISOString(),
          pausedAt: null,
          accumulatedSeconds: 0,
          presetWorkTaskTypeId: preset.workTaskTypeId,
          presetWorkTaskTypeName: preset.workTaskTypeName,
          presetValueType: preset.valueType,
        });
      },
      
      pauseTimer: () => {
        const { startedAt, accumulatedSeconds } = get();
        if (!startedAt) return;
        
        const now = new Date();
        const started = new Date(startedAt);
        const additionalSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);
        
        set({
          timerState: 'paused',
          pausedAt: now.toISOString(),
          accumulatedSeconds: accumulatedSeconds + additionalSeconds,
          startedAt: null,
        });
      },
      
      resumeTimer: () => {
        set({
          timerState: 'running',
          startedAt: new Date().toISOString(),
          pausedAt: null,
        });
      },
      
      stopTimer: () => {
        const totalSeconds = get().getElapsedSeconds();

        // Detener el timer y abrir modal de asignación
        set({
          timerState: 'idle',
          startedAt: null,
          pausedAt: null,
          isAssignmentModalOpen: true,
          pendingTimeSeconds: totalSeconds,
        });

        return totalSeconds;
      },
      
      resetTimer: () => {
        set({
          timerState: 'idle',
          startedAt: null,
          pausedAt: null,
          accumulatedSeconds: 0,
          pendingTimeSeconds: 0,
          presetWorkTaskTypeId: null,
          presetWorkTaskTypeName: null,
          presetValueType: null,
        });
      },
      
      clearPresets: () => {
        set({
          presetWorkTaskTypeId: null,
          presetWorkTaskTypeName: null,
          presetValueType: null,
        });
      },
      
      openAssignmentModal: (seconds: number) => {
        set({
          isAssignmentModalOpen: true,
          pendingTimeSeconds: seconds,
        });
      },
      
      closeAssignmentModal: () => {
        set({
          isAssignmentModalOpen: false,
          pendingTimeSeconds: 0,
          timerState: 'idle',
          startedAt: null,
          pausedAt: null,
          accumulatedSeconds: 0,
          presetWorkTaskTypeId: null,
          presetWorkTaskTypeName: null,
          presetValueType: null,
        });
      },
      
      getElapsedSeconds: () => {
        const { timerState, startedAt, accumulatedSeconds } = get();
        
        if (timerState === 'idle') return 0;
        
        if (timerState === 'paused') {
          return accumulatedSeconds;
        }
        
        // Running state
        if (!startedAt) return accumulatedSeconds;
        
        const now = new Date();
        const started = new Date(startedAt);
        const runningSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);
        
        return accumulatedSeconds + runningSeconds;
      },
    }),
    {
      name: 'capittal-work-timer',
      partialize: (state) => ({
        timerState: state.timerState,
        startedAt: state.startedAt,
        pausedAt: state.pausedAt,
        accumulatedSeconds: state.accumulatedSeconds,
        presetWorkTaskTypeId: state.presetWorkTaskTypeId,
        presetWorkTaskTypeName: state.presetWorkTaskTypeName,
        presetValueType: state.presetValueType,
        // Persist modal state to survive page refresh during assignment
        isAssignmentModalOpen: state.isAssignmentModalOpen,
        pendingTimeSeconds: state.pendingTimeSeconds,
      }),
    }
  )
);

// Utility function to format seconds to hh:mm:ss
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}
