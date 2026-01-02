-- Add order_index column for Kanban reordering
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add index for efficient ordering within each column
CREATE INDEX IF NOT EXISTS idx_tareas_estado_order ON tareas(estado, order_index);

-- Comment for documentation
COMMENT ON COLUMN tareas.order_index IS 'Position of task within its status column for Kanban ordering';