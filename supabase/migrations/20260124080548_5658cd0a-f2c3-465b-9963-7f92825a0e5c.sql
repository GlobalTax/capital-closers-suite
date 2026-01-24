
-- Fix RLS policy for documentos INSERT to allow admins
-- The current policy "Users can insert own documents" doesn't allow admins to insert

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documentos;

-- Create new policy that allows both users (own documents) and admins
CREATE POLICY "Users and admins can insert documents"
ON public.documentos
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() 
  OR public.current_user_is_admin()
);
