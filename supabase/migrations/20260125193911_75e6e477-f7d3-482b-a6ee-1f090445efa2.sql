-- ========================================
-- USER ONBOARDING PROGRESS TABLE
-- ========================================

CREATE TABLE public.user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Index for fast queries
CREATE INDEX idx_onboarding_user ON user_onboarding_progress(user_id);

-- RLS: Each user only sees/edits their own progress
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
ON user_onboarding_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress"
ON user_onboarding_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress"
ON user_onboarding_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own onboarding progress"
ON user_onboarding_progress FOR DELETE
TO authenticated
USING (user_id = auth.uid());