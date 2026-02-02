import { useState, useEffect, useCallback, useMemo } from "react";
import { useFinancialStatements } from "./useFinancialStatements";
import type { 
  PriceCalculation, 
  PriceBridgeItem, 
  PricingMethodology,
  LeakageItem,
  Shareholder
} from "@/types/pricing";
import { 
  calculateEquityValue, 
  calculateWorkingCapital,
  generateId 
} from "@/lib/pricing-utils";

const createInitialCalculation = (): PriceCalculation => ({
  methodology: 'completion_accounts',
  enterprise_value: 0,
  locked_box_date: undefined,
  completion_date: undefined,
  leakage_items: [],
  total_leakage: 0,
  permitted_leakage: 0,
  target_working_capital: 0,
  actual_working_capital: 0,
  working_capital_adjustment: 0,
  bridge_items: [],
  net_debt: 0,
  cash_equivalents: 0,
  long_term_debt: 0,
  short_term_debt: 0,
  inventories: 0,
  trade_receivables: 0,
  other_current_assets: 0,
  trade_payables: 0,
  other_current_liabilities: 0,
  shareholders: [],
  equity_value: 0,
});

export function usePriceCalculator(empresaId: string | undefined) {
  const { statements, isLoading } = useFinancialStatements(empresaId);
  const [calculation, setCalculation] = useState<PriceCalculation>(createInitialCalculation());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Get latest financial statement or selected year
  const currentStatement = useMemo(() => {
    if (!statements.length) return null;
    if (selectedYear) {
      return statements.find(s => s.year === selectedYear) || statements[0];
    }
    return statements[0]; // Most recent
  }, [statements, selectedYear]);

  // Initialize bridge items from financial data
  const initializeBridgeItems = useCallback((statement: typeof currentStatement) => {
    if (!statement) return [];

    const items: PriceBridgeItem[] = [
      {
        id: generateId(),
        label: 'Deuda Largo Plazo',
        value: statement.long_term_debt || 0,
        operation: 'subtract',
        editable: true,
        source: 'financial_statement',
        category: 'debt',
      },
      {
        id: generateId(),
        label: 'Deuda Corto Plazo',
        value: statement.short_term_debt || 0,
        operation: 'subtract',
        editable: true,
        source: 'financial_statement',
        category: 'debt',
      },
      {
        id: generateId(),
        label: 'Cash & Equivalentes',
        value: statement.cash_equivalents || 0,
        operation: 'add',
        editable: true,
        source: 'financial_statement',
        category: 'cash',
      },
    ];

    return items;
  }, []);

  // Load financial data when statement changes
  useEffect(() => {
    if (!currentStatement) return;

    const bridgeItems = initializeBridgeItems(currentStatement);
    const actualWC = calculateWorkingCapital(
      currentStatement.inventories || 0,
      currentStatement.trade_receivables || 0,
      currentStatement.other_current_assets || 0,
      currentStatement.trade_payables || 0,
      currentStatement.other_current_liabilities || 0
    );

    setCalculation(prev => ({
      ...prev,
      bridge_items: bridgeItems,
      net_debt: currentStatement.net_debt || 0,
      cash_equivalents: currentStatement.cash_equivalents || 0,
      long_term_debt: currentStatement.long_term_debt || 0,
      short_term_debt: currentStatement.short_term_debt || 0,
      inventories: currentStatement.inventories || 0,
      trade_receivables: currentStatement.trade_receivables || 0,
      other_current_assets: currentStatement.other_current_assets || 0,
      trade_payables: currentStatement.trade_payables || 0,
      other_current_liabilities: currentStatement.other_current_liabilities || 0,
      actual_working_capital: actualWC,
    }));
  }, [currentStatement, initializeBridgeItems]);

  // Recalculate equity value when inputs change
  useEffect(() => {
    const wcAdjustment = calculation.methodology === 'completion_accounts'
      ? calculation.actual_working_capital - calculation.target_working_capital
      : 0;

    // Add WC adjustment to bridge if completion accounts
    let bridgeWithWC = [...calculation.bridge_items];
    const wcItemIndex = bridgeWithWC.findIndex(item => item.category === 'wc');
    
    if (calculation.methodology === 'completion_accounts') {
      const wcItem: PriceBridgeItem = {
        id: wcItemIndex >= 0 ? bridgeWithWC[wcItemIndex].id : generateId(),
        label: 'Ajuste Working Capital',
        value: Math.abs(wcAdjustment),
        operation: wcAdjustment >= 0 ? 'add' : 'subtract',
        editable: false,
        source: 'calculated',
        category: 'wc',
      };

      if (wcItemIndex >= 0) {
        bridgeWithWC[wcItemIndex] = wcItem;
      } else {
        bridgeWithWC.push(wcItem);
      }
    } else {
      // Remove WC item for locked box
      bridgeWithWC = bridgeWithWC.filter(item => item.category !== 'wc');
    }

    // Calculate leakage for locked box
    let leakageAdjustment = 0;
    if (calculation.methodology === 'locked_box') {
      leakageAdjustment = calculation.total_leakage - calculation.permitted_leakage;
    }

    const equityValue = calculateEquityValue(calculation.enterprise_value, bridgeWithWC) - leakageAdjustment;

    setCalculation(prev => ({
      ...prev,
      bridge_items: bridgeWithWC,
      working_capital_adjustment: wcAdjustment,
      equity_value: equityValue,
    }));
  }, [
    calculation.enterprise_value,
    calculation.methodology,
    calculation.target_working_capital,
    calculation.actual_working_capital,
    calculation.total_leakage,
    calculation.permitted_leakage,
    // Note: we don't include bridge_items to avoid infinite loop
  ]);

  // Actions
  const setMethodology = useCallback((methodology: PricingMethodology) => {
    setCalculation(prev => ({ ...prev, methodology }));
  }, []);

  const setEnterpriseValue = useCallback((value: number) => {
    setCalculation(prev => ({ ...prev, enterprise_value: value }));
  }, []);

  const setTargetWorkingCapital = useCallback((value: number) => {
    setCalculation(prev => ({ ...prev, target_working_capital: value }));
  }, []);

  const setActualWorkingCapital = useCallback((value: number) => {
    setCalculation(prev => ({ ...prev, actual_working_capital: value }));
  }, []);

  const updateBridgeItem = useCallback((id: string, updates: Partial<PriceBridgeItem>) => {
    setCalculation(prev => ({
      ...prev,
      bridge_items: prev.bridge_items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const addBridgeItem = useCallback((item: Omit<PriceBridgeItem, 'id'>) => {
    const newItem: PriceBridgeItem = { ...item, id: generateId() };
    setCalculation(prev => ({
      ...prev,
      bridge_items: [...prev.bridge_items, newItem],
    }));
  }, []);

  const removeBridgeItem = useCallback((id: string) => {
    setCalculation(prev => ({
      ...prev,
      bridge_items: prev.bridge_items.filter(item => item.id !== id),
    }));
  }, []);

  const addLeakageItem = useCallback((item: Omit<LeakageItem, 'id'>) => {
    const newItem: LeakageItem = { ...item, id: generateId() };
    setCalculation(prev => {
      const newItems = [...prev.leakage_items, newItem];
      const totalLeakage = newItems.filter(i => !i.isPermitted).reduce((sum, i) => sum + i.value, 0);
      const permitted = newItems.filter(i => i.isPermitted).reduce((sum, i) => sum + i.value, 0);
      return {
        ...prev,
        leakage_items: newItems,
        total_leakage: totalLeakage,
        permitted_leakage: permitted,
      };
    });
  }, []);

  const removeLeakageItem = useCallback((id: string) => {
    setCalculation(prev => {
      const newItems = prev.leakage_items.filter(item => item.id !== id);
      const totalLeakage = newItems.filter(i => !i.isPermitted).reduce((sum, i) => sum + i.value, 0);
      const permitted = newItems.filter(i => i.isPermitted).reduce((sum, i) => sum + i.value, 0);
      return {
        ...prev,
        leakage_items: newItems,
        total_leakage: totalLeakage,
        permitted_leakage: permitted,
      };
    });
  }, []);

  const setLockedBoxDate = useCallback((date: string) => {
    setCalculation(prev => ({ ...prev, locked_box_date: date }));
  }, []);

  const setCompletionDate = useCallback((date: string) => {
    setCalculation(prev => ({ ...prev, completion_date: date }));
  }, []);

  const addShareholder = useCallback((shareholder: Omit<Shareholder, 'id'>) => {
    const newShareholder: Shareholder = { ...shareholder, id: generateId() };
    setCalculation(prev => ({
      ...prev,
      shareholders: [...prev.shareholders, newShareholder],
    }));
  }, []);

  const updateShareholder = useCallback((id: string, updates: Partial<Shareholder>) => {
    setCalculation(prev => ({
      ...prev,
      shareholders: prev.shareholders.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const removeShareholder = useCallback((id: string) => {
    setCalculation(prev => ({
      ...prev,
      shareholders: prev.shareholders.filter(s => s.id !== id),
    }));
  }, []);

  const resetCalculation = useCallback(() => {
    setCalculation(createInitialCalculation());
  }, []);

  return {
    calculation,
    statements,
    currentStatement,
    selectedYear,
    setSelectedYear,
    isLoading,
    // Actions
    setMethodology,
    setEnterpriseValue,
    setTargetWorkingCapital,
    setActualWorkingCapital,
    updateBridgeItem,
    addBridgeItem,
    removeBridgeItem,
    addLeakageItem,
    removeLeakageItem,
    setLockedBoxDate,
    setCompletionDate,
    addShareholder,
    updateShareholder,
    removeShareholder,
    resetCalculation,
  };
}
