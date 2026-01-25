-- Add watermark support columns to teaser_recipients
ALTER TABLE public.teaser_recipients 
  ADD COLUMN IF NOT EXISTS watermarked_path TEXT,
  ADD COLUMN IF NOT EXISTS watermarked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS watermark_text TEXT;

-- Add watermark configuration to teaser_campaigns
ALTER TABLE public.teaser_campaigns 
  ADD COLUMN IF NOT EXISTS enable_watermark BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS watermark_template TEXT DEFAULT 'Confidencial — {nombre} — {email} — ID:{id}';

-- Create index for efficient watermark status queries
CREATE INDEX IF NOT EXISTS idx_teaser_recipients_watermarked 
  ON public.teaser_recipients(campaign_id, watermarked_path) 
  WHERE watermarked_path IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.teaser_recipients.watermarked_path IS 'Storage path for personalized watermarked PDF';
COMMENT ON COLUMN public.teaser_recipients.watermark_text IS 'Actual watermark text applied to the PDF';
COMMENT ON COLUMN public.teaser_campaigns.enable_watermark IS 'Enable personalized PDF watermarks for each recipient';
COMMENT ON COLUMN public.teaser_campaigns.watermark_template IS 'Template for watermark text with placeholders: {nombre}, {email}, {id}';