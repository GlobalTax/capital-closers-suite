import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { canRegisterHoursForDate } from "@/services/dailyPlans.service";

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  planId?: string;
}

export function useDailyPlanValidation() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  
  const checkCanRegisterHours = useCallback(async (date: Date): Promise<ValidationResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Usuario no autenticado' };
    }
    
    try {
      setChecking(true);
      return await canRegisterHoursForDate(user.id, date);
    } catch (error) {
      console.error('Error checking plan validation:', error);
      // On error, allow registration (fail open)
      return { allowed: true };
    } finally {
      setChecking(false);
    }
  }, [user?.id]);
  
  return {
    checkCanRegisterHours,
    checking
  };
}
