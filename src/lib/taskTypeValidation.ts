import type { WorkTaskType } from '@/services/workTaskTypes.service';

export interface TaskTypeValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates form fields based on the selected work task type's requirements.
 * 
 * @param taskType - The selected work task type with require_* properties
 * @param values - The current form values to validate
 * @returns Validation result with isValid flag and array of error messages
 */
export function validateByTaskType(
  taskType: WorkTaskType | undefined,
  values: {
    mandatoId: string | null;
    leadId: string | null;
    description: string;
  }
): TaskTypeValidationResult {
  const errors: string[] = [];
  
  // If no task type selected, no dynamic rules apply
  if (!taskType) {
    return { isValid: true, errors: [] };
  }
  
  // Check mandato requirement
  if (taskType.require_mandato && !values.mandatoId) {
    errors.push('Mandato es obligatorio para este tipo de tarea');
  }
  
  // Check lead requirement
  if (taskType.require_lead && !values.leadId) {
    errors.push('Lead es obligatorio para este tipo de tarea');
  }
  
  // Check description requirement
  if (taskType.require_description) {
    const trimmed = values.description.trim();
    if (trimmed.length === 0) {
      errors.push('Descripción es obligatoria para este tipo de tarea');
    } else if (trimmed.length < 10) {
      errors.push('Descripción debe tener al menos 10 caracteres');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper to get field requirement labels
 */
export function getFieldRequirement(
  taskType: WorkTaskType | undefined,
  field: 'mandato' | 'lead' | 'description'
): { required: boolean; label: string } {
  if (!taskType) {
    return { required: field === 'mandato', label: field === 'mandato' ? '*' : '' };
  }
  
  switch (field) {
    case 'mandato':
      return { 
        required: taskType.require_mandato, 
        label: taskType.require_mandato ? '*' : '' 
      };
    case 'lead':
      return { 
        required: taskType.require_lead, 
        label: taskType.require_lead ? '*' : '(opcional)' 
      };
    case 'description':
      return { 
        required: taskType.require_description, 
        label: taskType.require_description ? '*' : '(opcional)' 
      };
    default:
      return { required: false, label: '' };
  }
}
