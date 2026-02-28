import { create } from 'zustand'

interface LoadingState {
    isLoading: boolean;
    message?: string;
    startLoading: (message?: string) => void;
    stopLoading: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
    isLoading: false,
    message: undefined,
    startLoading: (message) => set({ isLoading: true, message }),
    stopLoading: () => set({ isLoading: false, message: undefined }),
}));
