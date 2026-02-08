
-- Table: executive_reports
CREATE TABLE public.executive_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary_text TEXT,
  metrics_snapshot JSONB,
  mandatos_snapshot JSONB,
  recommendations JSONB,
  recipients TEXT[],
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read executive reports"
  ON public.executive_reports FOR SELECT
  USING (current_user_can_read());

CREATE POLICY "Admins can insert executive reports"
  ON public.executive_reports FOR INSERT
  WITH CHECK (current_user_can_write());

CREATE POLICY "Admins can update executive reports"
  ON public.executive_reports FOR UPDATE
  USING (current_user_can_write());

-- Table: executive_report_recipients
CREATE TABLE public.executive_report_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.executive_report_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read recipients"
  ON public.executive_report_recipients FOR SELECT
  USING (current_user_can_read());

CREATE POLICY "Admins can manage recipients"
  ON public.executive_report_recipients FOR ALL
  USING (current_user_can_write());

-- Indexes
CREATE INDEX idx_executive_reports_date ON public.executive_reports (report_date DESC);
CREATE INDEX idx_executive_report_recipients_active ON public.executive_report_recipients (active) WHERE active = true;
