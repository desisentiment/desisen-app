import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, AuthState } from '@/types';

interface AuthStore extends AuthState {
  // Login/Logout
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // User management
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  
  // Session management
  sessionExpiry: number | null;
  setSessionExpiry: (expiry: number | null) => void;
  checkSession: () => boolean;
  
  // Permission helpers
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isUser: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Login
      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call - password will be used when integrating with actual auth API
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          const user: User = {
            id: `user-${Date.now()}`,
            email,
            role: 'admin', // Default role for demo - has all permissions
            createdAt: new Date(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            sessionExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          sessionExpiry: null,
        });
      },

      // Set user
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      // Update user
      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...data },
          });
        }
      },

      // Session management
      sessionExpiry: null,
      setSessionExpiry: (expiry: number | null) => {
        set({ sessionExpiry: expiry });
      },
      checkSession: () => {
        const { sessionExpiry, isAuthenticated } = get();
        if (!isAuthenticated || !sessionExpiry) return false;
        return Date.now() < sessionExpiry;
      },

      // Permission helpers
      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },
      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin';
      },
      isManager: () => {
        const user = get().user;
        return user?.role === 'manager';
      },
      isUser: () => {
        const user = get().user;
        return user?.role === 'user';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);
