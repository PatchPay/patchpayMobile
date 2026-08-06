/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

import {
  NotificationItem,
  clearAllNotifications as apiClearAll,
  deleteNotification as apiDelete,
  markNotificationAsRead as apiMarkAsRead,
  getUserNotifications,
} from "@/api/notifications";
import { useAuth } from "@/hooks/useAuth";

// How often to silently refresh the unread count in the background (ms)
const POLL_INTERVAL = 30000;

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(
    async (isManualRefresh = false) => {
      if (!user?.id) return;
      try {
        if (isManualRefresh) setRefreshing(true);
        const result = await getUserNotifications();
        setNotifications(result);
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  const refresh = useCallback(
    () => fetchNotifications(true),
    [fetchNotifications],
  );

  const markAsRead = useCallback(async (id: string) => {
    // optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await apiMarkAsRead(id);
    } catch (err) {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    }
  }, []);

  const removeNotification = useCallback(
    async (id: string) => {
      const prevState = notifications;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await apiDelete(id);
      } catch (err) {
        setNotifications(prevState);
      }
    },
    [notifications],
  );

  const clearAll = useCallback(async () => {
    const prevState = notifications;
    setNotifications([]);
    try {
      await apiClearAll();
    } catch (err) {
      setNotifications(prevState);
    }
  }, [notifications]);

  // Initial load + background polling
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    pollRef.current = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        fetchNotifications();
      }
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      sub.remove();
    };
  }, [user?.id, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        error,
        refresh,
        markAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return ctx;
};
