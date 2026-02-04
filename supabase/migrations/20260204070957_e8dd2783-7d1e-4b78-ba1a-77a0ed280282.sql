-- Table for managing email recipients for various reports
CREATE TABLE public.report_email_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT report_email_recipients_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT report_email_recipients_unique_email_per_type UNIQUE (report_type, email)
);

-- Add comment
COMMENT ON TABLE public.report_email_recipients IS 'Manages email recipients for automated reports (daily hours, weekly summaries, etc.)';

-- Enable RLS
ALTER TABLE public.report_email_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only super_admin and admin can manage
CREATE POLICY "Admins can view report recipients"
  ON public.report_email_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can insert report recipients"
  ON public.report_email_recipients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can update report recipients"
  ON public.report_email_recipients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete report recipients"
  ON public.report_email_recipients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_report_email_recipients_updated_at
  BEFORE UPDATE ON public.report_email_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial recipients
INSERT INTO public.report_email_recipients (report_type, email, name, is_active)
VALUES 
  ('hours_daily', 'Lluis@capittal.es', 'Lluis', true),
  ('hours_daily', 'Samuel@capittal.es', 'Samuel', true);

-- Create index for faster lookups
CREATE INDEX idx_report_email_recipients_type_active 
  ON public.report_email_recipients(report_type, is_active)
  WHERE is_active = true;