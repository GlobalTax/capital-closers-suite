-- =============================================
-- CIM ACCESS REVOCATION FIELDS + SECURITY
-- =============================================

-- Add revocation fields to teaser_recipients
ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_revoked_at TIMESTAMPTZ;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_revoked_by UUID;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_revoke_reason TEXT;

-- Add nda_signed_by for audit trail
ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_signed_by UUID;

-- Create or replace can_access_cim function with revocation check
CREATE OR REPLACE FUNCTION public.can_access_cim(p_recipient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teaser_recipients
    WHERE id = p_recipient_id
    AND (nda_status = 'signed' OR cim_access_granted = true)
    AND cim_access_revoked_at IS NULL
  )
$$;

-- Index for revocation queries
CREATE INDEX IF NOT EXISTS idx_teaser_recipients_cim_revoked 
ON public.teaser_recipients(cim_access_revoked_at) 
WHERE cim_access_revoked_at IS NOT NULL;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION public.can_access_cim TO authenticated, anon;