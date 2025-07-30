import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
}

interface Branch {
    id: string;
    code: string;
    name: string;
    location: string;
}

interface Module {
    id: string;
    code: string;
    name: string;
    icon: string;
    description: string;
    color?: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    selectedBranch: Branch | null;
    selectedModule: Module | null;
    biometricEnabled: boolean;

    // Actions
    login: (user: User) => void;
    logout: () => void;
    setBranch: (branch: Branch) => void;
    setModule: (module: Module) => void;
    setBiometricEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            selectedBranch: null,
            selectedModule: null,
            biometricEnabled: false,

            login: (user: User) => {
                set({ isAuthenticated: true, user });
            },

            logout: () => {
                set({
                    isAuthenticated: false,
                    user: null,
                    selectedBranch: null,
                    selectedModule: null,
                });
            },

            setBranch: (branch: Branch) => {
                set({ selectedBranch: branch });
            },

            setModule: (module: Module) => {
                set({ selectedModule: module });
            },

            setBiometricEnabled: (enabled: boolean) => {
                set({ biometricEnabled: enabled });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);