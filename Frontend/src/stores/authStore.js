import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authAPI.login(email, password);
                    const { token, user } = response.data;

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({ isLoading: false, error: errorMessage });
                    return { success: false, error: errorMessage };
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await authAPI.register(data);
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Registration failed';
                    set({ isLoading: false, error: errorMessage });
                    return { success: false, error: errorMessage };
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            checkAuth: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    return false;
                }

                try {
                    const response = await authAPI.getMe();
                    set({
                        user: response.data,
                        token,
                        isAuthenticated: true,
                    });
                    return true;
                } catch (error) {
                    get().logout();
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
