import { create } from 'zustand';

interface Notification {
  id: string;
  event: string;
  payload: Record<string, any>;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (event: string, payload: Record<string, any>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (event, payload) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      event,
      payload,
      timestamp: payload.timestamp || new Date().toISOString(),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
