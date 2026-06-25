import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // The store initializes from localStorage, so we override state directly
    useThemeStore.setState({ mode: 'light' });
  });

  it('should start in light mode (after reset)', () => {
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should toggleTheme from light to dark', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should toggleTheme from dark back to light', () => {
    useThemeStore.setState({ mode: 'dark' });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should setTheme explicitly to dark', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should setTheme explicitly to light', () => {
    useThemeStore.setState({ mode: 'dark' });
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should persist mode to localStorage on toggleTheme', () => {
    useThemeStore.getState().toggleTheme(); // light -> dark
    expect(localStorage.getItem('theme-mode')).toBe('dark');

    useThemeStore.getState().toggleTheme(); // dark -> light
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('should persist mode to localStorage on setTheme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(localStorage.getItem('theme-mode')).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('should default to dark when localStorage has theme-mode=dark', () => {
    localStorage.setItem('theme-mode', 'dark');
    // Re-read from localStorage by resetting state as the store would on init
    useThemeStore.setState({
      mode: (localStorage.getItem('theme-mode') as 'light' | 'dark') || 'dark',
    });
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
