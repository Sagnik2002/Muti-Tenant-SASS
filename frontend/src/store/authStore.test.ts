import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock the auth API
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

import { authApi } from '../api/auth';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store and localStorage
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should start with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    vi.mocked(authApi.login).mockResolvedValueOnce({
      data: { data: { accessToken: 'at', refreshToken: 'rt', user: mockUser } },
    } as any);

    await useAuthStore.getState().login('test@example.com', 'password');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('at');
    expect(localStorage.getItem('accessToken')).toBe('at');
  });

  it('should handle login failure', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    await expect(useAuthStore.getState().login('bad@example.com', 'wrong')).rejects.toBeDefined();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should logout and clear state', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
    });
    localStorage.setItem('accessToken', 'at');
    vi.mocked(authApi.logout).mockResolvedValueOnce({} as any);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('should updateUser without losing other fields', () => {
    const initialUser = { id: '1', email: 'a@b.com', firstName: 'Old', lastName: 'Name' };
    useAuthStore.setState({ user: initialUser });

    useAuthStore.getState().updateUser({ firstName: 'New' });

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('New');
    expect(state.user?.lastName).toBe('Name');
    expect(state.user?.email).toBe('a@b.com');
  });

  it('should clearError', () => {
    useAuthStore.setState({ error: 'some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should set isLoading true during login', async () => {
    let resolveLogin!: (value: any) => void;
    vi.mocked(authApi.login).mockReturnValueOnce(
      new Promise((res) => { resolveLogin = res; }),
    );

    const loginPromise = useAuthStore.getState().login('test@example.com', 'password');
    expect(useAuthStore.getState().isLoading).toBe(true);

    resolveLogin({
      data: { data: { accessToken: 'at', refreshToken: 'rt', user: { id: '1', email: 'test@example.com', firstName: 'T', lastName: 'U' } } },
    });
    await loginPromise;
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should register successfully', async () => {
    const mockUser = { id: '2', email: 'new@example.com', firstName: 'New', lastName: 'User' };
    vi.mocked(authApi.register).mockResolvedValueOnce({
      data: { data: { accessToken: 'at2', refreshToken: 'rt2', user: mockUser } },
    } as any);

    await useAuthStore.getState().register({
      email: 'new@example.com',
      password: 'pass123',
      firstName: 'New',
      lastName: 'User',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(localStorage.getItem('accessToken')).toBe('at2');
  });

  it('should handle register failure', async () => {
    vi.mocked(authApi.register).mockRejectedValueOnce({
      response: { data: { message: 'Email already in use' } },
    });

    await expect(
      useAuthStore.getState().register({ email: 'dup@example.com', password: 'p', firstName: 'D', lastName: 'U' }),
    ).rejects.toBeDefined();

    expect(useAuthStore.getState().error).toBe('Email already in use');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should setTokens and mark as authenticated', () => {
    useAuthStore.getState().setTokens('newAt', 'newRt');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('newAt');
    expect(state.refreshToken).toBe('newRt');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('newAt');
    expect(localStorage.getItem('refreshToken')).toBe('newRt');
  });

  it('should refreshAccessToken and update tokens', async () => {
    useAuthStore.setState({ refreshToken: 'old-rt' });
    vi.mocked(authApi.refresh).mockResolvedValueOnce({
      data: { data: { accessToken: 'new-at', refreshToken: 'new-rt' } },
    } as any);

    await useAuthStore.getState().refreshAccessToken();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-at');
    expect(state.refreshToken).toBe('new-rt');
  });

  it('should logout if refreshAccessToken fails', async () => {
    useAuthStore.setState({ refreshToken: 'bad-rt', isAuthenticated: true });
    vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error('expired'));
    vi.mocked(authApi.logout).mockResolvedValueOnce({} as any);

    await useAuthStore.getState().refreshAccessToken();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should not attempt refresh when no refreshToken', async () => {
    useAuthStore.setState({ refreshToken: null });
    await useAuthStore.getState().refreshAccessToken();
    expect(authApi.refresh).not.toHaveBeenCalled();
  });

  it('should updateUser do nothing when user is null', () => {
    useAuthStore.setState({ user: null });
    useAuthStore.getState().updateUser({ firstName: 'Ghost' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
