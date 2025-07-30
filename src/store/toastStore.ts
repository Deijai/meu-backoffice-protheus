import { create } from 'zustand';

interface ToastState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;

    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    hideToast: () => void;

    // Métodos de conveniência
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
    visible: false,
    message: '',
    type: 'info',
    duration: 4000,

    showToast: (message: string, type = 'info', duration = 4000) => {
        set({
            visible: true,
            message,
            type,
            duration,
        });
    },

    hideToast: () => {
        set({ visible: false });
    },

    showSuccess: (message: string, duration = 4000) => {
        set({
            visible: true,
            message,
            type: 'success',
            duration,
        });
    },

    showError: (message: string, duration = 5000) => {
        set({
            visible: true,
            message,
            type: 'error',
            duration,
        });
    },

    showWarning: (message: string, duration = 4000) => {
        set({
            visible: true,
            message,
            type: 'warning',
            duration,
        });
    },

    showInfo: (message: string, duration = 4000) => {
        set({
            visible: true,
            message,
            type: 'info',
            duration,
        });
    },
}));