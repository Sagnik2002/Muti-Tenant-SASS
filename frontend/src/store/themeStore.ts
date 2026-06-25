import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (localStorage.getItem('theme-mode') as 'light' | 'dark') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return { mode: newMode };
    }),
  setTheme: (mode) => {
    localStorage.setItem('theme-mode', mode);
    set({ mode });
  },
}));
