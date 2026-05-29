import { create } from 'zustand';
import type { CalculationResult } from '../types';

interface ResultsStore {
  result: CalculationResult | null;
  isCalculating: boolean;
  showResults: boolean;
  expandedSteps: Record<string, boolean>;
  setResult: (result: CalculationResult) => void;
  setCalculating: (v: boolean) => void;
  toggleResults: () => void;
  toggleStep: (key: string) => void;
  clearResults: () => void;
}

export const useResultsStore = create<ResultsStore>((set) => ({
  result: null,
  isCalculating: false,
  showResults: false,
  expandedSteps: {},

  setResult: (result) => set({ result, showResults: true }),
  setCalculating: (v) => set({ isCalculating: v }),
  toggleResults: () => set(s => ({ showResults: !s.showResults })),
  toggleStep: (key) =>
    set(s => ({ expandedSteps: { ...s.expandedSteps, [key]: !s.expandedSteps[key] } })),
  clearResults: () => set({ result: null, showResults: false }),
}));
