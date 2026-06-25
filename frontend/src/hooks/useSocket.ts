import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

/**
 * WebSocket hook for real-time notifications.
 * Connects to the notifications namespace and joins the org room.
 */
export function useSocket(orgId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!accessToken || !orgId) return;

    const socket = io('/notifications', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected');
      socket.emit('join-org', orgId);
    });

    // Listen for all notification events
    const events = [
      'project:created',
      'project:updated',
      'task:assigned',
      'task:updated',
    ];

    events.forEach((event) => {
      socket.on(event, (payload: Record<string, any>) => {
        addNotification(event, payload);
      });
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });

    return () => {
      socket.emit('leave-org', orgId);
      socket.disconnect();
    };
  }, [accessToken, orgId, addNotification]);

  const emit = useCallback(
    (event: string, data: any) => {
      socketRef.current?.emit(event, data);
    },
    [],
  );

  return { emit };
}
