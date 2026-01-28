import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { canRegisterHoursForDate } from "@/services/dailyPlans.service";

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  planId?: string;
}

export function useDailyPlanValidation() {
  const { user } = useAuth();
  const { isAdmin } = useSimpleAuth();
  const [checking, setChecking] = useState(false);
  
  const checkCanRegisterHours = useCallback(async (date: Date): Promise<ValidationResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Usuario no autenticado' };
    }
    
    try {
      setChecking(true);
      return await canRegisterHoursForDate(user.id, date, isAdmin);
    } catch (error) {
      console.error('Error checking plan validation:', error);
      // On error, allow registration (fail open)
      return { allowed: true };
    } finally {
      setChecking(false);
    }
  }, [user?.id, isAdmin]);
  
  return {
    checkCanRegisterHours,
    checking
  };
}
