import { create } from 'zustand';

export const useProjectionStore = create((set) => ({
    currentProjection: null,
    scenarios: [],
    monteCarloResults: null,
    isLoading: false,
    error: null,

    setProjection: (projection) => set({ currentProjection: projection }),

    setScenarios: (scenarios) => set({ scenarios }),

    setMonteCarloResults: (results) => set({ monteCarloResults: results }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearProjection: () => set({
        currentProjection: null,
        scenarios: [],
        monteCarloResults: null,
        error: null
    }),
}));
