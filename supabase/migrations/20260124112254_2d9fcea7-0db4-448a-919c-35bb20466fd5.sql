-- Remove conflicting INSERT policy that uses current_user_is_admin()
-- The unified ALL policy already covers INSERT operations

DROP POLICY IF EXISTS "Admins can upload mandato documents" ON storage.objects;