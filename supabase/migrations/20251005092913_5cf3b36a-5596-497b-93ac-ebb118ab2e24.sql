-- Crear enum para tipos de transacción
CREATE TYPE transaction_type AS ENUM (
  'ingreso',
  'gasto',
  'honorario',
  'due_diligence',
  'ajuste_valoracion',
  'comision',
  'otro'
);

-- Crear enum para estados de transacción
CREATE TYPE transaction_status AS ENUM (
  'pendiente',
  'completada',
  'cancelada'
);

-- Tabla principal de transacciones
CREATE TABLE mandato_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id TEXT NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT '€',
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status transaction_status NOT NULL DEFAULT 'completada',
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES admin_users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_mandato_transactions_mandato ON mandato_transactions(mandato_id);
CREATE INDEX idx_mandato_transactions_date ON mandato_transactions(transaction_date);
CREATE INDEX idx_mandato_transactions_type ON mandato_transactions(transaction_type);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_mandato_transactions
  BEFORE UPDATE ON mandato_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE mandato_transactions ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y gestionar transacciones
CREATE POLICY "Admins can manage transactions"
ON mandato_transactions
FOR ALL
TO authenticated
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());