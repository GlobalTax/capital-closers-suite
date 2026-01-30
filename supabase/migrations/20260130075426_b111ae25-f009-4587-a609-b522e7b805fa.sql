-- ============================================
-- FASE 5: REFORZAR POLÍTICAS RLS PERMISIVAS
-- Solo tablas que existen con certeza
-- ============================================

-- =====================
-- CAMPAIGNS
-- =====================
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;

CREATE POLICY "Admins can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can update campaigns" ON public.campaigns
  FOR UPDATE USING (public.current_user_can_write()) WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete campaigns" ON public.campaigns
  FOR DELETE USING (public.current_user_can_write());

-- =====================
-- CAMPAIGN_COST_SNAPSHOTS
-- =====================
DROP POLICY IF EXISTS "Authenticated users can create snapshots" ON public.campaign_cost_snapshots;
DROP POLICY IF EXISTS "Authenticated users can update snapshots" ON public.campaign_cost_snapshots;
DROP POLICY IF EXISTS "Authenticated users can delete snapshots" ON public.campaign_cost_snapshots;

CREATE POLICY "Admins can create snapshots" ON public.campaign_cost_snapshots
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can update snapshots" ON public.campaign_cost_snapshots
  FOR UPDATE USING (public.current_user_can_write()) WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete snapshots" ON public.campaign_cost_snapshots
  FOR DELETE USING (public.current_user_can_write());

-- =====================
-- CORPORATE_FAVORITES
-- =====================
DROP POLICY IF EXISTS "Authenticated users can insert corporate favorites" ON public.corporate_favorites;
DROP POLICY IF EXISTS "Authenticated users can delete corporate favorites" ON public.corporate_favorites;

CREATE POLICY "Admins can insert corporate favorites" ON public.corporate_favorites
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete corporate favorites" ON public.corporate_favorites
  FOR DELETE USING (public.current_user_can_write());

-- =====================
-- CR_FAVORITES
-- =====================
DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON public.cr_favorites;
DROP POLICY IF EXISTS "Authenticated users can delete favorites" ON public.cr_favorites;

CREATE POLICY "Admins can insert favorites" ON public.cr_favorites
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete favorites" ON public.cr_favorites
  FOR DELETE USING (public.current_user_can_write());

-- =====================
-- PIPELINE_STAGES
-- =====================
DROP POLICY IF EXISTS "Authenticated can insert" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Authenticated can update" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Authenticated can delete" ON public.pipeline_stages;

CREATE POLICY "Admins can insert pipeline stages" ON public.pipeline_stages
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can update pipeline stages" ON public.pipeline_stages
  FOR UPDATE USING (public.current_user_can_write()) WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete pipeline stages" ON public.pipeline_stages
  FOR DELETE USING (public.current_user_can_write());

-- =====================
-- SECTORS
-- =====================
DROP POLICY IF EXISTS "Authenticated users can insert sectors" ON public.sectors;
DROP POLICY IF EXISTS "Authenticated users can update sectors" ON public.sectors;
DROP POLICY IF EXISTS "Authenticated users can delete sectors" ON public.sectors;

CREATE POLICY "Admins can insert sectors" ON public.sectors
  FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can update sectors" ON public.sectors
  FOR UPDATE USING (public.current_user_can_write()) WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can delete sectors" ON public.sectors
  FOR DELETE USING (public.current_user_can_write());