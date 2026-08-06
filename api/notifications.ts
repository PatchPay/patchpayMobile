import axiosInstance from "@/api/axiosInstance"; // adjust to your shared axios client (bearer token attached via interceptor)

// Adjust if the router is mounted under a different prefix in your Express app
// e.g. app.use("/api/notifications", notificationRoutes) -> BASE = "/api/notifications"
const BASE = "/notifications";

export interface NotificationItem {
  id: string;
  senderId: string | null;
  recipientId: string;
  title?: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * GET /notifications
 * Fetch the logged-in user's notifications (latest 50, newest first).
 */
export const getUserNotifications = async (): Promise<NotificationItem[]> => {
  const { data } =
    await axiosInstance.get<ApiResponse<NotificationItem[]>>(BASE);
  return data?.data ?? [];
};

/**
 * POST /notifications
 * Create a notification for yourself (system/self-triggered notifications).
 */
export const createNotification = async (
  payload: Partial<NotificationItem>,
): Promise<NotificationItem> => {
  const { data } = await axiosInstance.post<ApiResponse<NotificationItem>>(
    BASE,
    payload,
  );
  return data.data as NotificationItem;
};

/**
 * POST /notifications/recipient/:accountNumber
 * Send a notification to another user identified by their bank account number.
 */
export const notifyRecipient = async (
  accountNumber: string,
  payload: Partial<NotificationItem>,
): Promise<NotificationItem> => {
  const { data } = await axiosInstance.post<ApiResponse<NotificationItem>>(
    `${BASE}/recipient/${accountNumber}`,
    payload,
  );
  return data.data as NotificationItem;
};

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (
  id: string,
): Promise<NotificationItem> => {
  const { data } = await axiosInstance.patch<ApiResponse<NotificationItem>>(
    `${BASE}/${id}/read`,
  );
  return data.data as NotificationItem;
};

/**
 * DELETE /notifications/:id
 * Delete a single notification.
 */
export const deleteNotification = async (id: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
};

/**
 * DELETE /notifications
 * Clear every notification belonging to the logged-in user.
 */
export const clearAllNotifications = async (): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(BASE);
};
