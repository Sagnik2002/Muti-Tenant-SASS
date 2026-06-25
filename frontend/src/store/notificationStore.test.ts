import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
  });

  it('should start with empty notifications', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should add a notification and increment unreadCount', () => {
    useNotificationStore
      .getState()
      .addNotification('project:created', { name: 'Test Project', timestamp: '2024-01-01T00:00:00Z' });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].event).toBe('project:created');
    expect(state.notifications[0].read).toBe(false);
  });

  it('should use the provided timestamp from payload', () => {
    const ts = '2024-06-01T12:00:00Z';
    useNotificationStore.getState().addNotification('task:created', { timestamp: ts });
    expect(useNotificationStore.getState().notifications[0].timestamp).toBe(ts);
  });

  it('should fall back to current ISO timestamp when payload has no timestamp', () => {
    const before = Date.now();
    useNotificationStore.getState().addNotification('task:created', {});
    const after = Date.now();

    const ts = new Date(useNotificationStore.getState().notifications[0].timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('should mark a notification as read', () => {
    useNotificationStore.getState().addNotification('task:assigned', { title: 'Fix bug' });
    const { notifications } = useNotificationStore.getState();
    const id = notifications[0].id;

    useNotificationStore.getState().markAsRead(id);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('should not go below 0 unreadCount when marking already-read notification', () => {
    useNotificationStore.getState().addNotification('task:assigned', {});
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);
    useNotificationStore.getState().markAsRead(id); // second call on already-read

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should markAllAsRead', () => {
    useNotificationStore.getState().addNotification('project:created', {});
    useNotificationStore.getState().addNotification('task:updated', {});

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });

  it('should clearAll', () => {
    useNotificationStore.getState().addNotification('project:created', {});
    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should cap notifications at 50', () => {
    for (let i = 0; i < 55; i++) {
      useNotificationStore.getState().addNotification('project:created', { i });
    }
    expect(useNotificationStore.getState().notifications).toHaveLength(50);
  });

  it('should prepend new notifications (newest first)', () => {
    useNotificationStore.getState().addNotification('first', {});
    useNotificationStore.getState().addNotification('second', {});

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].event).toBe('second');
    expect(notifications[1].event).toBe('first');
  });

  it('should assign a unique id to each notification', () => {
    useNotificationStore.getState().addNotification('a', {});
    useNotificationStore.getState().addNotification('b', {});

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].id).not.toBe(notifications[1].id);
  });
});
