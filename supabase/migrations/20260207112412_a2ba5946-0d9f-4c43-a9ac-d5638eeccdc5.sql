
-- Create the document-templates bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('document-templates', 'document-templates', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for admin access
CREATE POLICY "Admins can read document-templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-templates' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can upload document-templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-templates' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update document-templates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'document-templates' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can delete document-templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-templates' AND public.is_user_admin(auth.uid()));
