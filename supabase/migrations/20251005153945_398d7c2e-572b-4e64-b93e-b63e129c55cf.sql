-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'uploads', 
  'uploads', 
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- RLS Policy: Admins can view all files
CREATE POLICY "Admins can view all uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND current_user_is_admin()
);

-- RLS Policy: Admins can delete any file
CREATE POLICY "Admins can delete any upload"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND current_user_is_admin()
);

-- Update documentos table to ensure proper structure
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update RLS policies for documentos table
DROP POLICY IF EXISTS "Users can view own documents" ON documentos;
DROP POLICY IF EXISTS "Admins can view all documents" ON documentos;
DROP POLICY IF EXISTS "Users can insert own documents" ON documentos;
DROP POLICY IF EXISTS "Users can delete own documents" ON documentos;
DROP POLICY IF EXISTS "Admins can delete any document" ON documentos;

CREATE POLICY "Users can view own documents"
ON documentos FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid() OR current_user_is_admin());

CREATE POLICY "Users can insert own documents"
ON documentos FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own documents"
ON documentos FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() OR current_user_is_admin());