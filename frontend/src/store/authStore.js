import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isHydrated: false,

            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true
            }),

            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),

            logout: () => {
                localStorage.removeItem('token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('Auth store hydration failed:', error);
                }
                setTimeout(() => {
                    if (state?.token && !state?.isAuthenticated) {
                        useAuthStore.setState({ isAuthenticated: true });
                    }
                    useAuthStore.setState({ isHydrated: true });
                }, 0);
            }
        }
    )
);
