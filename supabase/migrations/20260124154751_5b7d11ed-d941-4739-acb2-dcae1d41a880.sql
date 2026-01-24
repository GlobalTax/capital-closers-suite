-- =============================================
-- PROMPT 15: Correcciones de Seguridad RLS + Trigger
-- =============================================

-- 1. EMPRESA_FINANCIAL_STATEMENTS: Eliminar políticas duplicadas permisivas
-- Mantenemos solo la política de admin que ya existe
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear estados financieros" ON empresa_financial_statements;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar estados financieros" ON empresa_financial_statements;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar estados financieros" ON empresa_financial_statements;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver estados financieros" ON empresa_financial_statements;

-- 2. MANDATO_EMPRESA_SCORING: Corregir de public a authenticated
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver scoring" ON mandato_empresa_scoring;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear scoring" ON mandato_empresa_scoring;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar scoring" ON mandato_empresa_scoring;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar scoring" ON mandato_empresa_scoring;

-- Recrear con rol authenticated correcto
CREATE POLICY "Authenticated read scoring" ON mandato_empresa_scoring
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated insert scoring" ON mandato_empresa_scoring
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update scoring" ON mandato_empresa_scoring
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete scoring" ON mandato_empresa_scoring
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 3. TARGET_OFERTAS: Corregir de public a authenticated
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver ofertas" ON target_ofertas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear ofertas" ON target_ofertas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar ofertas" ON target_ofertas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar ofertas" ON target_ofertas;

-- Recrear con rol authenticated correcto
CREATE POLICY "Authenticated read ofertas" ON target_ofertas
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated insert ofertas" ON target_ofertas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update ofertas" ON target_ofertas
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete ofertas" ON target_ofertas
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 4. TRIGGER: Crear trigger faltante para pipeline_stage_changed_at
DROP TRIGGER IF EXISTS tr_update_pipeline_stage_changed_at ON mandato_empresas;

CREATE TRIGGER tr_update_pipeline_stage_changed_at
BEFORE UPDATE ON mandato_empresas
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stage_changed_at();