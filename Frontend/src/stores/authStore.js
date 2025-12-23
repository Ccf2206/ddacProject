import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            permissions: [], // Add permissions array
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authAPI.login(email, password);
                    const { token, user } = response.data;

                    console.log('[Auth] Login response user:', user);
                    console.log('[Auth] User role:', user.role);

                    // Parse permissions from user.role.permissions if available
                    let permissions = [];
                    if (user.role && user.role.permissions) {
                        console.log('[Auth] Raw permissions:', user.role.permissions);
                        console.log('[Auth] Permissions type:', typeof user.role.permissions);
                        try {
                            // Check if permissions is already an array or needs parsing
                            if (Array.isArray(user.role.permissions)) {
                                permissions = user.role.permissions;
                            } else if (typeof user.role.permissions === 'string') {
                                permissions = JSON.parse(user.role.permissions);
                            }
                            console.log('[Auth] Parsed permissions:', permissions);
                        } catch (e) {
                            console.error('[Auth Store] Failed to parse permissions:', e);
                        }
                    } else {
                        console.log('[Auth] No role or permissions found');
                    }

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('permissions', JSON.stringify(permissions));

                    set({
                        user,
                        token,
                        permissions,
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
                localStorage.removeItem('permissions');
                set({
                    user: null,
                    token: null,
                    permissions: [],
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
                    const user = response.data;

                    // Parse permissions from user.role.permissions if available
                    let permissions = [];
                    if (user.role && user.role.permissions) {
                        try {
                            // Check if permissions is already an array or needs parsing
                            if (Array.isArray(user.role.permissions)) {
                                permissions = user.role.permissions;
                            } else if (typeof user.role.permissions === 'string') {
                                permissions = JSON.parse(user.role.permissions);
                            }
                        } catch (e) {
                            console.error('[Auth Store] Failed to parse permissions:', e);
                        }
                    }

                    set({
                        user,
                        token,
                        permissions,
                        isAuthenticated: true,
                    });
                    return true;
                } catch (error) {
                    console.error(error);
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
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
