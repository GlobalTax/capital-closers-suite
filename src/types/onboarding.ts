// Types for User Onboarding Progress

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  step_id: string;
  completed_at: string | null;
  skipped: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  actionRoute: string;
  autoCompleteCheck?: 'has_empresa' | 'has_contacto' | 'has_mandato' | 'has_documento' | 'has_tarea' | 'has_viewed_report';
}

export interface OnboardingState {
  steps: {
    id: string;
    completed: boolean;
    completedAt: string | null;
    skipped: boolean;
  }[];
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  isComplete: boolean;
}
